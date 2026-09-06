"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { sim } from "@/lib/simStore";
import { world } from "@/lib/state";
import { GRID, N, PHASES, phaseAt, phaseStart } from "@/lib/sim";
import { projects } from "@/data/portfolio";

// ── palette as linear-ish colours (bloom reads values > 1) ──
const CHALK = new THREE.Color("#eef3ff");
const CHALK_DIM = new THREE.Color("#8a9ccb");
const SURFACE = new THREE.Color("#102a63");
const SURFACE_DEAD = new THREE.Color("#061238");
const CAUTION = new THREE.Color("#ffd23f");

// precomputed once — useFrame must not allocate
const TILE = Array.from({ length: N }, (_, i) => ({ x: (i % GRID) - (GRID - 1) / 2, z: Math.floor(i / GRID) - (GRID - 1) / 2 }));
const tilePos = (i: number) => TILE[i];
const HOLD_MS = 650;
const TRAIL_SEGS = 14;
const WF_START = phaseStart("workflows");

// drafting grid + dithered under-glow on the ground plane
const groundVert = /* glsl */ `
varying vec2 vXZ;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.0);
  vXZ = w.xz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const groundFrag = /* glsl */ `
uniform vec3 uBg; uniform vec3 uLine; uniform vec3 uChalk; uniform vec3 uCaution; uniform float uGlow;
uniform float uTick;
uniform vec4 uKills[4]; // x, z, tick of death, active
varying vec2 vXZ;
float bayer4(vec2 p){
  // 4x4 ordered-dither matrix indexed by screen pixel, never by UV —
  // locked to the display like a print artifact
  int x = int(mod(p.x, 4.0)); int y = int(mod(p.y, 4.0));
  int idx = (x + y * 4);
  int m[16]; m[0]=0;m[1]=8;m[2]=2;m[3]=10;m[4]=12;m[5]=4;m[6]=14;m[7]=6;m[8]=3;m[9]=11;m[10]=1;m[11]=9;m[12]=15;m[13]=7;m[14]=13;m[15]=5;
  return (float(m[idx]) + 0.5) / 16.0;
}
void main(){
  // shockwaves: each kill sends a ring out through the drafting grid, bending
  // the lines as it passes and leaving a dithered caution halo that fades
  vec2 xz = vXZ;
  float halo = 0.0;
  for (int k = 0; k < 4; k++) {
    if (uKills[k].w < 0.5) continue;
    float age = uTick - uKills[k].z;
    if (age < 0.0) continue;
    vec2 dv = vXZ - uKills[k].xy;
    float r = length(dv);
    float front = age * 0.11;
    float env = exp(-abs(r - front) * 2.2) * (1.0 - smoothstep(0.0, 110.0, age));
    xz += normalize(dv + 1e-4) * sin((r - front) * 9.0) * 0.06 * env;
    halo = max(halo, env * (1.0 - smoothstep(0.0, 2.6, r)) * 0.9);
  }
  vec2 g = abs(fract(xz + 0.5) - 0.5);
  float d = min(g.x, g.y);
  float major = 1.0 - smoothstep(0.0, 0.012, d);
  vec2 g2 = abs(fract(xz * 4.0 + 0.5) - 0.5);
  float minor = (1.0 - smoothstep(0.0, 0.04, min(g2.x, g2.y))) * 0.35;
  float r = length(vXZ);
  float fade = 1.0 - smoothstep(4.0, 14.0, r);
  // soft chalk glow under the cluster, quantised through the dither
  float glow = (1.0 - smoothstep(0.5, 4.2, r)) * uGlow * 0.22;
  float dith = step(bayer4(gl_FragCoord.xy), glow * 1.6);
  vec3 col = uBg;
  col = mix(col, uLine, (major * 0.9 + minor) * fade);
  col = mix(col, uChalk, dith * 0.18);
  float hdith = step(bayer4(gl_FragCoord.xy + 2.0), halo);
  col = mix(col, uCaution, hdith * 0.55);
  gl_FragColor = vec4(col, 1.0);
}`;

export default function Cluster() {
  const { camera, size, invalidate } = useThree();
  const slabs = useRef<THREE.InstancedMesh>(null!);
  const rings = useRef<THREE.InstancedMesh>(null!);
  const flags = useRef<THREE.InstancedMesh>(null!);
  const workers = useRef<THREE.InstancedMesh>(null!);
  const heads = useRef<THREE.InstancedMesh>(null!);
  const trails = useRef<THREE.InstancedMesh>(null!);
  const [captions, setCaptions] = useState<{ key: string; tile: number; text: string; kind: string }[]>([]);
  const lastCaptionKey = useRef("");
  const groundMat = useRef<THREE.ShaderMaterial>(null!);
  const hold = useRef<{ tile: number; since: number } | null>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const col = useMemo(() => new THREE.Color(), []);
  const camTarget = useMemo(() => new THREE.Vector3(), []);
  const lookAt = useMemo(() => new THREE.Vector3(), []);
  const hueColors = useMemo(() => projects.map((p) => new THREE.Color().setHSL(p.hue / 360, 0.85, 0.62)), []);

  // static wireframe of the tile grid — the drawing's chalk lines
  const wire = useMemo(() => {
    const pts: number[] = [];
    const h = 0.06, s = 0.46;
    for (let i = 0; i < N; i++) {
      const c = tilePos(i);
      const corners = [
        [c.x - s, c.z - s], [c.x + s, c.z - s], [c.x + s, c.z + s], [c.x - s, c.z + s],
      ];
      for (let k = 0; k < 4; k++) {
        const a = corners[k], b = corners[(k + 1) % 4];
        pts.push(a[0], h, a[1], b[0], h, b[1]);
        pts.push(a[0], -h, a[1], b[0], -h, b[1]);
        pts.push(a[0], -h, a[1], a[0], h, a[1]);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  useEffect(() => () => wire.dispose(), [wire]);

  // workers: 3 fixed slots per tile; a slot the current run does not use is
  // scaled to zero, so a reseed never leaves stale cubes behind
  const workerSlots = useMemo(() => {
    const out: { tile: number; w: number; dx: number; dz: number; phase: number }[] = [];
    for (let i = 0; i < N; i++) {
      for (let w = 0; w < 3; w++) {
        out.push({ tile: i, w, dx: -0.22 + w * 0.22, dz: 0.18 - w * 0.12, phase: (i * 7 + w * 13) % 17 });
      }
    }
    return out;
  }, []);

  // lay out static matrices before the first frame (a frame or a raycast
  // landing between commit and a passive effect would see identity matrices)
  useLayoutEffect(() => {
    for (let i = 0; i < N; i++) {
      const p = tilePos(i);
      tmp.position.set(p.x, 0, p.z);
      tmp.scale.set(0.92, 0.12, 0.92);
      tmp.updateMatrix();
      slabs.current.setMatrixAt(i, tmp.matrix);
      slabs.current.setColorAt(i, SURFACE);
    }
    slabs.current.instanceMatrix.needsUpdate = true;
    if (slabs.current.instanceColor) slabs.current.instanceColor.needsUpdate = true;
    slabs.current.computeBoundingSphere();
  }, [tmp]);

  const overUI = (e: ThreeEvent<PointerEvent>) =>
    !!(e.nativeEvent.target as Element | null)?.closest("a, button, input, textarea, [role='dialog'], [data-ui]");
  const onDown = (e: ThreeEvent<PointerEvent>) => {
    if (overUI(e) || e.instanceId === undefined) return;
    if (!sim.snapshot.alive[e.instanceId] || sim.snapshot.power[e.instanceId] < 0.5) return;
    hold.current = { tile: e.instanceId, since: performance.now() };
    invalidate(); // demand mode: the hold re-queues frames from useFrame
  };
  const onUp = () => {
    hold.current = null;
    world.holdProgress = 0;
  };
  useEffect(() => {
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const firstFrame = useRef(true);
  const frameloopRef = useRef<string>("always");
  const lookCur = useMemo(() => new THREE.Vector3(), []);
  useFrame((_state, rawDelta) => {
    const delta = Math.min(rawDelta, 1 / 30);
    const s = sim.snapshot;
    const run = sim.run;
    const tick = sim.tick;

    // drafting captions on the nodes the log is talking about (rare React update)
    const capKey = s.events.map((e) => e.tick + e.text).join("|");
    if (capKey !== lastCaptionKey.current) {
      lastCaptionKey.current = capKey;
      const next: typeof captions = [];
      for (const e of s.events.slice(-5)) {
        if (tick - e.tick > 140) continue;
        const m = /(?:node|lease|shard) (\d+)/.exec(e.text);
        if (!m) continue;
        const tile = Number(m[1]);
        let text = "";
        if (/killed/.test(e.text)) text = "SIGKILL";
        else if (/^lease/.test(e.text)) text = e.text.replace(/^lease \d+ → /, "LEASE → n").replace(/\s+\(token (\d+)\)/, " · t$1").toUpperCase();
        else if (e.kind === "fence") text = e.text.replace(/.*token (\d+) < (\d+)/, "FENCED · t$1 < t$2");
        else if (/no live neighbour/.test(e.text)) text = "NO LIVE NEIGHBOUR";
        else if (/recovered/.test(e.text)) text = "RECOVERED";
        else continue;
        next.push({ key: e.tick + e.text, tile, text, kind: e.kind });
      }
      setCaptions(next);
    }

    // hold-to-kill progress (in demand mode keep asking for frames while held)
    if (hold.current) {
      if (_state.frameloop === "demand") _state.invalidate();
      const p = (performance.now() - hold.current.since) / HOLD_MS;
      world.holdProgress = Math.min(1, p);
      if (p >= 1) {
        sim.kill(hold.current.tile);
        hold.current = null;
        world.holdProgress = 0;
      }
    }

    // ── slabs: colour by power / alive / facet highlight ──
    const facetTiles = world.facet >= 0 ? run.facetShards[world.facet] : null;
    for (let i = 0; i < N; i++) {
      const pw = s.power[i];
      const alive = s.alive[i];
      col.copy(alive ? SURFACE : SURFACE_DEAD);
      if (alive) col.lerp(CHALK_DIM, 0.12 * pw);
      if (facetTiles && facetTiles.includes(i)) col.lerp(CHALK, 0.22);
      if (world.hoverTile === i && alive) col.lerp(CHALK, 0.3);
      if (hold.current?.tile === i) col.lerp(CAUTION, world.holdProgress * 0.6);
      col.multiplyScalar(0.25 + 0.75 * pw);
      slabs.current.setColorAt(i, col);
    }
    slabs.current.instanceColor!.needsUpdate = true;

    // ── lease rings: on the holder's tile; yellow when the shard is orphaned ──
    for (let i = 0; i < N; i++) {
      const holder = s.holder[i];
      const pw = s.power[i];
      const at = holder >= 0 ? tilePos(holder) : tilePos(i);
      const stacked = holder >= 0 && holder !== i;
      tmp.position.set(at.x + (stacked ? 0.18 : 0), 0.12 + (stacked ? 0.1 : 0), at.z + (stacked ? -0.18 : 0));
      const sc = pw * (holder === -1 ? 0.7 : 1);
      tmp.scale.setScalar(sc);
      tmp.rotation.set(Math.PI / 2, 0, 0);
      tmp.updateMatrix();
      rings.current.setMatrixAt(i, tmp.matrix);
      if (holder === -1) col.copy(CAUTION).multiplyScalar(2.6);
      else if (stacked) col.copy(CHALK).multiplyScalar(1.6 + 0.4 * Math.sin(tick * 0.2));
      else col.copy(CHALK).multiplyScalar(0.9 + 0.5 * pw * s.activity[i]);
      rings.current.setColorAt(i, col);
    }
    rings.current.instanceMatrix.needsUpdate = true;
    rings.current.instanceColor!.needsUpdate = true;

    // ── survey flags on dead nodes: caution yellow stakes ──
    for (let i = 0; i < N; i++) {
      const dead = !s.alive[i] && s.power[i] > 0.05;
      const p = tilePos(i);
      tmp.position.set(p.x - 0.3, dead ? 0.32 : 0, p.z - 0.3);
      tmp.scale.set(dead ? 1 : 0.0001, dead ? 1 : 0.0001, dead ? 1 : 0.0001);
      tmp.rotation.set(0, 0, 0);
      tmp.updateMatrix();
      flags.current.setMatrixAt(i, tmp.matrix);
      col.copy(CAUTION).multiplyScalar(2.2);
      flags.current.setColorAt(i, col);
    }
    flags.current.instanceMatrix.needsUpdate = true;
    flags.current.instanceColor!.needsUpdate = true;

    // ── workers: bob with deterministic activity, vanish with their node ──
    workerSlots.forEach((w, k) => {
      const p = tilePos(w.tile);
      const on = s.alive[w.tile] && w.w < run.workers[w.tile] ? s.power[w.tile] : 0;
      const bob = 0.5 + 0.5 * Math.sin((tick + w.phase * 9) * 0.11);
      tmp.position.set(p.x + w.dx, 0.14 + bob * 0.06 * on, p.z + w.dz);
      tmp.scale.setScalar(0.1 * on);
      tmp.rotation.set(0, 0, 0);
      tmp.updateMatrix();
      workers.current.setMatrixAt(k, tmp.matrix);
    });
    workers.current.instanceMatrix.needsUpdate = true;

    // ── workflow heads: crawl their paths, hue per project, bloom ──
    run.workflows.forEach((w, k) => {
      const t = tick - WF_START - w.startAt;
      let vis = 0;
      let x = 0, z = 0;
      if (t >= 0) {
        const idx = Math.min(w.path.length - 1, Math.floor(t / 24));
        const next = Math.min(w.path.length - 1, idx + 1);
        const f = idx === w.path.length - 1 ? 0 : (t % 24) / 24;
        const a = tilePos(w.path[idx]), b = tilePos(w.path[next]);
        x = a.x + (b.x - a.x) * f;
        z = a.z + (b.z - a.z) * f;
        vis = 1;
      }
      const open = world.project === projects[k].slug;
      tmp.position.set(x, 0.42 + (open ? 0.2 : 0), z);
      tmp.scale.setScalar(vis * (open ? 0.22 : 0.13));
      tmp.rotation.set(0, tick * 0.02 + k, Math.PI / 4);
      tmp.updateMatrix();
      heads.current.setMatrixAt(k, tmp.matrix);
      col.copy(hueColors[k]).multiplyScalar(open ? 3.2 : 2.2);
      heads.current.setColorAt(k, col);
    });
    heads.current.instanceMatrix.needsUpdate = true;
    heads.current.instanceColor!.needsUpdate = true;

    // ── ground glow follows the cluster's overall power ──
    let avg = 0;
    for (let i = 0; i < N; i++) avg += s.power[i];
    groundMat.current.uniforms.uGlow.value = avg / N;
    groundMat.current.uniforms.uTick.value = tick;
    // the last four kills ripple through the drawing (rewinds with the tick)
    const kills = s.events.filter((e) => e.kind === "warn" && / killed/.test(e.text)).slice(-4);
    const kv = groundMat.current.uniforms.uKills.value as THREE.Vector4[];
    for (let k = 0; k < 4; k++) {
      const e = kills[k];
      const t = e ? Number(/node (\d+)/.exec(e.text)?.[1]) : NaN;
      if (e && Number.isFinite(t)) kv[k].set(TILE[t].x, TILE[t].z, e.tick, 1);
      else kv[k].set(0, 0, 0, 0);
    }

    // ── trails: each workflow leaves its path behind it, fading by distance ──
    run.workflows.forEach((w, k) => {
      const t = tick - WF_START - w.startAt;
      const idx = t < 0 ? -1 : Math.min(w.path.length - 1, Math.floor(t / 24));
      for (let j = 0; j < TRAIL_SEGS; j++) {
        const slot = k * TRAIL_SEGS + j;
        const visible = idx > j && j + 1 < w.path.length;
        if (!visible) {
          tmp.scale.setScalar(0.0001);
          tmp.position.set(0, -1, 0);
          tmp.updateMatrix();
          trails.current.setMatrixAt(slot, tmp.matrix);
          trails.current.setColorAt(slot, col.set(0, 0, 0)); // keeps instanceColor allocated
          continue;
        }
        const a = TILE[w.path[j]], b = TILE[w.path[j + 1]];
        const dx = b.x - a.x, dz = b.z - a.z;
        tmp.position.set((a.x + b.x) / 2, 0.2, (a.z + b.z) / 2);
        tmp.rotation.set(0, Math.atan2(dx, dz), 0);
        tmp.scale.set(0.05, 0.02, Math.hypot(dx, dz));
        tmp.updateMatrix();
        trails.current.setMatrixAt(slot, tmp.matrix);
        const fade = Math.max(0.15, 1 - (idx - j) / 6);
        col.copy(hueColors[k]).multiplyScalar(0.4 + 1.4 * fade);
        trails.current.setColorAt(slot, col);
      }
    });
    trails.current.instanceMatrix.needsUpdate = true;
    trails.current.instanceColor!.needsUpdate = true;

    // ── camera: pure function of (phase, local, open project), then damped ──
    const { phase, local } = phaseAt(tick);
    const pi = PHASES.indexOf(phase);
    const yawKeys = [0, -8, 6, -10, 4, 0, 0];
    // closer on landscape screens so the drawing fills the frame; portrait
    // backs off below to keep the whole cluster in view
    const distKeys = [10.8, 9.4, 8.4, 9.4, 9, 11, 11];
    const yaw = THREE.MathUtils.degToRad(45 + THREE.MathUtils.lerp(yawKeys[pi], yawKeys[pi + 1], local));
    let dist = THREE.MathUtils.lerp(distKeys[pi], distKeys[pi + 1], local);
    // narrow (portrait) viewports need the camera further back to keep the
    // whole cluster in frame under the fixed 32° vertical fov
    const aspect = size.width / size.height;
    const portrait = aspect < 1.1;
    if (portrait) dist *= Math.min(1.45, 1.0 / aspect); // close enough to fill the width
    const fov = portrait ? 44 : 32;
    if ((camera as THREE.PerspectiveCamera).fov !== fov) {
      (camera as THREE.PerspectiveCamera).fov = fov;
      camera.updateProjectionMatrix();
    }
    let pitch = THREE.MathUtils.degToRad(35);
    lookAt.set(0, 0, 0);
    // on wide screens the hero type owns the left; push the cluster right
    if (size.width > 900 && pi <= 1) {
      const w = pi === 0 ? 1 : 1 - local;
      lookAt.x = -2.4 * w; // cluster sits right of the type column
      lookAt.z = 0.9 * w; // and rides a little higher in the frame
    } else if (size.width <= 900 && pi <= 1) {
      // portrait: lift the drawing into the upper half so the type owns the bottom
      const w = pi === 0 ? 1 : 1 - local;
      lookAt.x = 2.8 * w;
      lookAt.z = 2.8 * w;
    }
    if (world.project) {
      const k = projects.findIndex((p) => p.slug === world.project);
      const w = run.workflows[k];
      if (w) {
        let cx = 0, cz = 0;
        for (const ti of w.path) { cx += TILE[ti].x; cz += TILE[ti].z; }
        lookAt.set(cx / w.path.length, 0, cz / w.path.length);
      }
      pitch = THREE.MathUtils.degToRad(82);
      dist = 6.5;
    }
    camTarget.set(
      lookAt.x + dist * Math.cos(pitch) * Math.sin(yaw),
      lookAt.y + dist * Math.sin(pitch),
      lookAt.z + dist * Math.cos(pitch) * Math.cos(yaw)
    );
    // first frame and on-demand (reduced motion) frames snap; otherwise damp
    frameloopRef.current = _state.frameloop;
    const snap = firstFrame.current || _state.frameloop === "demand";
    firstFrame.current = false;
    const k = snap ? 1 : 1 - Math.exp(-3.2 * delta);
    camera.position.lerp(camTarget, k);
    lookCur.lerp(lookAt, k);
    camera.lookAt(lookCur);
  });

  return (
    <group>
      <hemisphereLight args={["#b7c6ea", "#061238", 0.9]} />
      <directionalLight position={[4, 8, 3]} intensity={1.1} color="#eef3ff" />

      <mesh position={[0, -0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 60]} />
        <shaderMaterial
          ref={groundMat}
          vertexShader={groundVert}
          fragmentShader={groundFrag}
          uniforms={{
            uBg: { value: new THREE.Color("#0b1f4f") },
            uLine: { value: new THREE.Color("#2a4a93") },
            uChalk: { value: CHALK },
            uCaution: { value: CAUTION },
            uGlow: { value: 0 },
            uTick: { value: 0 },
            uKills: { value: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()] },
          }}
        />
      </mesh>

      <lineSegments geometry={wire}>
        <lineBasicMaterial color="#eef3ff" transparent opacity={0.28} />
      </lineSegments>

      <instancedMesh
        ref={slabs}
        args={[undefined, undefined, N]}
        frustumCulled={false}
        onPointerDown={onDown}
        onPointerOver={(e) => {
          if (overUI(e) || e.instanceId === undefined || !sim.snapshot.alive[e.instanceId] || sim.snapshot.power[e.instanceId] < 0.5) return;
          world.hoverTile = e.instanceId;
          document.body.style.cursor = "crosshair";
          invalidate();
        }}
        onPointerOut={() => {
          world.hoverTile = -1;
          document.body.style.cursor = "";
          hold.current = null; // leaving the tile aborts the kill (WCAG 2.5.2)
          world.holdProgress = 0;
          invalidate();
        }}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.92} metalness={0.05} />
      </instancedMesh>

      <instancedMesh ref={rings} args={[undefined, undefined, N]} frustumCulled={false}>
        <torusGeometry args={[0.27, 0.018, 8, 40]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      <instancedMesh ref={flags} args={[undefined, undefined, N]} frustumCulled={false}>
        <boxGeometry args={[0.035, 0.5, 0.035]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      <instancedMesh ref={workers} args={[undefined, undefined, workerSlots.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#b7c6ea" roughness={0.8} />
      </instancedMesh>

      <instancedMesh ref={heads} args={[undefined, undefined, projects.length]} frustumCulled={false}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      <instancedMesh ref={trails} args={[undefined, undefined, projects.length * TRAIL_SEGS]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {captions.map((c) => (
        <Html
          key={c.key}
          position={[TILE[c.tile].x, 0.62, TILE[c.tile].z]}
          center
          zIndexRange={[5, 0]}
          style={{ pointerEvents: "none", whiteSpace: "nowrap" }}
        >
          <span
            className={`type-label border px-1.5 py-0.5 ${
              c.kind === "fence" || c.text === "SIGKILL" || c.text === "NO LIVE NEIGHBOUR"
                ? "border-accent bg-bg/80 text-accent"
                : "border-text/60 bg-bg/80 text-text"
            }`}
          >
            n{c.tile} · {c.text}
          </span>
        </Html>
      ))}
    </group>
  );
}
