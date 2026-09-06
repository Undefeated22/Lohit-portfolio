"use client";

import { useEffect, useState } from "react";
import { Component, type ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { NoToneMapping } from "three";
import { PerformanceMonitor } from "@react-three/drei";
import { EffectComposer, Bloom, Noise, SMAA } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import Cluster from "./Cluster";
import { useReducedMotionSafe } from "@/lib/motion";
import { sim } from "@/lib/simStore";

// demand mode: redraw whenever the simulator changes (scroll, kill, reseed)
function InvalidateOnSim() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => sim.subscribe(() => invalidate()), [invalidate]);
  return null;
}

// If WebGL fails (no context, driver crash) the DOM must survive untouched.
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

// One persistent drawing behind the whole page. DOM owns every word;
// WebGL owns only the cluster. Post chain is tiered by measured performance.
export default function Scene() {
  const reduced = useReducedMotionSafe();
  const [tier, setTier] = useState<0 | 1 | 2>(2);
  const [dpr, setDpr] = useState(1.5);
  const [eventSource, setEventSource] = useState<HTMLElement>();
  const [monitor, setMonitor] = useState(false);
  useEffect(() => {
    setEventSource(document.body);
    const t = setTimeout(() => setMonitor(true), 2500); // let the first frames settle
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 z-0" aria-hidden>
      <SceneBoundary>
      <Canvas
        dpr={dpr}
        camera={{ position: [7, 7, 7], fov: 32, near: 0.5, far: 60 }}
        flat
        frameloop={reduced ? "demand" : "always"}
        gl={{ antialias: false, alpha: false, powerPreference: "high-performance", stencil: false }}
        eventSource={eventSource}
        eventPrefix="client"
        style={{ pointerEvents: "none" }}
        onCreated={({ gl }) => { gl.setClearColor("#0b1f4f", 1); gl.toneMapping = NoToneMapping; }}
      >
        <color attach="background" args={["#0b1f4f"]} />
        <fog attach="fog" args={["#0b1f4f", 12, 34]} />
        {monitor && !reduced && (
          <PerformanceMonitor
            factor={1}
            flipflops={3}
            onChange={({ factor }) => setDpr(Math.round((0.75 + 0.75 * factor) * 4) / 4)}
            onDecline={() => setTier((t) => Math.max(0, t - 1) as 0 | 1 | 2)}
            onIncline={() => setTier((t) => Math.min(2, t + 1) as 0 | 1 | 2)}
            onFallback={() => { setTier(0); setDpr(1); }}
          />
        )}
        <Cluster />
        {reduced && <InvalidateOnSim />}
        {!reduced && tier > 0 && (
          <EffectComposer multisampling={0}>
            {/* tier 1 drops the three full-res SMAA passes; bloom + noise stay */}
            {tier === 2 ? <SMAA /> : <></>}
            <Bloom mipmapBlur intensity={0.75} luminanceThreshold={1} luminanceSmoothing={0.2} />
            <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.14} />
          </EffectComposer>
        )}
      </Canvas>
      </SceneBoundary>
    </div>
  );
}
