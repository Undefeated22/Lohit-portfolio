"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { world } from "@/lib/state";

// ashima 3D simplex noise, the standard compact GLSL implementation
const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+10.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.5-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 105.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

const coreVertex = /* glsl */ `
uniform float uTime;
uniform float uAmp;
varying float vNoise;
varying float vCrack;
varying vec3 vNormal;
varying vec3 vView;
${NOISE}
void main(){
  float n = snoise(normal * 2.6 + vec3(uTime * 0.1));
  float n2 = snoise(normal * 6.5 - vec3(uTime * 0.05));
  vNoise = n * 0.65 + n2 * 0.35;
  // zero-crossings of the fine octave read as fissures in the crust
  vCrack = 1.0 - smoothstep(0.0, 0.14, abs(n2));
  vec3 displaced = position + normal * vNoise * uAmp;
  vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

const coreFragment = /* glsl */ `
uniform float uGlow;
uniform float uWarm;
uniform vec3 uTint;
uniform float uTintMix;
varying float vNoise;
varying float vCrack;
varying vec3 vNormal;
varying vec3 vView;
void main(){
  float ndv = clamp(dot(vNormal, vView), 0.0, 1.0);
  float rim = pow(1.0 - ndv, 3.2);
  float halo = pow(1.0 - ndv, 1.3) * 0.18;
  // blackbody-ish crust: ridges run hotter than valleys
  vec3 body = mix(vec3(0.016, 0.015, 0.019), vec3(0.068, 0.031, 0.022), smoothstep(-0.6, 0.9, vNoise));
  vec3 ember = mix(vec3(1.0, 0.36, 0.12), uTint, uTintMix);
  vec3 hot = mix(ember, vec3(1.0, 0.85, 0.65), uWarm);
  float heat = smoothstep(0.5, 0.95, vNoise) * 0.35;
  vec3 col = body
    + hot * (rim * (0.7 + uGlow * 1.6) + halo)
    + hot * heat * (0.2 + uGlow)
    + hot * vCrack * (0.26 + uGlow * 1.4 + uWarm * 0.5);
  // soft shoulder so the ignite finale saturates to deep ember, not white clip
  col = col / (1.0 + col * 0.35);
  gl_FragColor = vec4(col, 1.0);
}`;

const haloVertex = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const haloFragment = /* glsl */ `
uniform float uGlow;
uniform float uWarm;
uniform vec3 uTint;
uniform float uTintMix;
varying vec2 vUv;
void main(){
  float d = length(vUv - 0.5) * 2.0;
  float a = exp(-d * 4.0);
  vec3 ember = mix(vec3(1.0, 0.36, 0.12), uTint, uTintMix);
  vec3 hot = mix(ember, vec3(1.0, 0.85, 0.65), uWarm);
  gl_FragColor = vec4(hot * a, a * (0.06 + uGlow * 0.35 + uWarm * 0.10));
}`;

const pointsVertex = /* glsl */ `
uniform float uTime;
uniform float uPix;
uniform float uIgnite;
attribute float aSeed;
varying float vFade;
varying float vHeat;
void main(){
  vec3 p = position;
  // slow orbital drift, phase-offset per particle
  float a = uTime * 0.03 + aSeed * 6.2831;
  p.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * p.xz;
  p.y += sin(uTime * 0.2 + aSeed * 40.0) * 0.12;
  // the field collapses into the ignition point at the finale
  p *= 1.0 - uIgnite * 0.35 * (0.3 + 0.7 * aSeed);
  float rr = length(position);
  vHeat = smoothstep(5.8, 2.4, rr);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = (1.4 + aSeed * 2.2) * uPix * (5.5 / -mv.z);
  // per-particle base fade × slow twinkle × depth fog
  vFade = (0.25 + 0.75 * fract(aSeed * 7.31))
    * (0.75 + 0.25 * sin(uTime * 2.0 + aSeed * 60.0))
    * smoothstep(11.0, 5.0, -mv.z);
  gl_Position = projectionMatrix * mv;
}`;

const pointsFragment = /* glsl */ `
varying float vFade;
varying float vHeat;
void main(){
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float soft = smoothstep(0.5, 0.05, d);
  // inner particles are sparks, outer are cool ash
  vec3 col = mix(vec3(0.95, 0.85, 0.75), vec3(1.0, 0.42, 0.16), vHeat);
  gl_FragColor = vec4(col, soft * 0.55 * vFade);
}`;

function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

// facet temperaments: [noise-speed multiplier, amp bias]
// BUILD churns, SYSTEMS settles into order, VERIFY goes deterministic-still,
// EXPERIMENT jitters hot — the About copy, made physical.
const SIG: [number, number][] = [
  [1.3, 0.04],
  [0.7, -0.02],
  [0.35, -0.05],
  [2.4, 0.05],
];

const tmpColor = new THREE.Color();

export default function Core() {
  const group = useRef<THREE.Group>(null!);
  const haloMesh = useRef<THREE.Mesh>(null!);
  const warm = useRef(0);
  const phase = useRef(0);
  const speed = useRef(1);
  const ampBias = useRef(0);
  const crash = useRef(0);
  const { size } = useThree();
  const mobile = size.width < 768;

  const coreUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmp: { value: 0.17 },
      uGlow: { value: 0 },
      uWarm: { value: 0 },
      uTint: { value: new THREE.Color("#ff5c1f") },
      uTintMix: { value: 0 },
    }),
    []
  );

  const particles = useMemo(() => {
    const count = mobile ? 450 : 1300;
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // shell distribution around the core
      const r = 2.4 + Math.pow(Math.random(), 0.7) * 3.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7;
      pos[i * 3 + 2] = r * Math.cos(phi);
      seed[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    return geo;
  }, [mobile]);

  useEffect(() => () => particles.dispose(), [particles]);

  const pointsUniforms = useMemo(
    () => ({ uTime: { value: 0 }, uPix: { value: 1 }, uIgnite: { value: 0 } }),
    []
  );

  useFrame((state, rawDelta) => {
    // clamp: a stray long frame (tab switch, demand-mode invalidate) must not
    // teleport the rotation or damp targets
    const delta = Math.min(rawDelta, 1 / 30);
    const t = state.clock.elapsedTime % 3600;
    const p = world.scroll;
    const u = coreUniforms;

    // decoupled phase clock so facet temperaments change speed without popping
    const sig = world.facet >= 0 ? SIG[world.facet] : null;
    speed.current = THREE.MathUtils.damp(speed.current, sig?.[0] ?? 1, 3, delta);
    ampBias.current = THREE.MathUtils.damp(ampBias.current, sig?.[1] ?? 0, 3, delta);
    phase.current = (phase.current + delta * speed.current) % 3600;
    u.uTime.value = phase.current;
    pointsUniforms.uTime.value = t;
    pointsUniforms.uPix.value = state.gl.getPixelRatio();

    // signature interaction: holding "crash" tears the surface apart fast;
    // release recovers with a slower damp — the system replaying its log
    crash.current = THREE.MathUtils.damp(
      crash.current,
      world.crash,
      world.crash ? 7 : 2.2,
      delta
    );

    // breathing at rest, receding through the middle, igniting at the end
    const breathe = 0.17 + Math.sin(t * 0.5) * 0.03;
    const recede = 1 - 0.45 * smoothstep(0.12, 0.3, p);
    const ignite = smoothstep(0.82, 0.98, p);
    u.uAmp.value =
      (breathe + ampBias.current) * recede * (1 - ignite * 0.75) +
      world.cursorEnergy * 0.12 +
      crash.current * 0.5;
    u.uGlow.value = ignite * 1.2 + world.cursorEnergy * 0.25 + crash.current * 1.3;
    pointsUniforms.uIgnite.value = ignite;

    // About facet hover warms the core toward white-hot
    warm.current = THREE.MathUtils.damp(warm.current, world.facet >= 0 ? 0.65 : 0, 4, delta);
    u.uWarm.value = warm.current;

    // in the work zone the core digests the centered project's hue (capped so
    // ember stays the identity)
    const mid = smoothstep(0.12, 0.3, p) * (1 - smoothstep(0.75, 0.92, p));
    u.uTintMix.value = mid * 0.35;
    tmpColor.setHSL(world.hue / 360, 0.8, 0.55);
    u.uTint.value.lerp(tmpColor, 1 - Math.exp(-4 * delta));

    world.cursorEnergy = Math.max(0, world.cursorEnergy - delta * 1.6);

    const g = group.current;
    const scale = (1 - 0.3 * smoothstep(0.12, 0.3, p)) * (1 - ignite * 0.55);
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, scale, 4, delta));

    // constant slow spin + cursor-led tilt; a crashing system spins out
    g.rotation.y += delta * (0.08 + world.cursorEnergy * 0.3 + crash.current * 1.6);
    const px = world.pointerX, py = world.pointerY;
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, py * 0.18, 3, delta);
    g.rotation.z = THREE.MathUtils.damp(g.rotation.z, -px * 0.12, 3, delta);

    // drift: right-of-center in hero (balances left-aligned type), further right
    // and back mid-page, dead center for the finale
    const hero = 1 - smoothstep(0.12, 0.3, p);
    const targetX = mobile ? 0 : hero * 1.05 + mid * 2.1;
    const targetZ = -mid * 1.8;
    g.position.x = THREE.MathUtils.damp(g.position.x, targetX, 3, delta);
    g.position.z = THREE.MathUtils.damp(g.position.z, targetZ, 3, delta);

    // the halo casts the core's light onto the scene, inheriting its drift
    const h = haloMesh.current;
    h.position.set(g.position.x, g.position.y, g.position.z - 0.5);
    h.scale.setScalar(Math.max(g.scale.x, 0.001));
  });

  return (
    <>
      <mesh ref={haloMesh} position={[0, 0, -0.5]}>
        <planeGeometry args={[7.5, 7.5]} />
        <shaderMaterial
          vertexShader={haloVertex}
          fragmentShader={haloFragment}
          uniforms={coreUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <group ref={group}>
        <mesh>
          <icosahedronGeometry args={[1.32, mobile ? 16 : 24]} />
          <shaderMaterial
            vertexShader={coreVertex}
            fragmentShader={coreFragment}
            uniforms={coreUniforms}
          />
        </mesh>
        <points geometry={particles}>
          <shaderMaterial
            vertexShader={pointsVertex}
            fragmentShader={pointsFragment}
            uniforms={pointsUniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      </group>
    </>
  );
}
