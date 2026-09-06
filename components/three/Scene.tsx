"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";
import { EffectComposer, Bloom, Noise, Vignette, SMAA } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import Cluster from "./Cluster";
import { useReducedMotionSafe } from "@/lib/motion";

// One persistent drawing behind the whole page. DOM owns every word;
// WebGL owns only the cluster. Post chain is tiered by measured performance.
export default function Scene() {
  const reduced = useReducedMotionSafe();
  const [tier, setTier] = useState<0 | 1 | 2>(2);
  const [dpr, setDpr] = useState(1.5);
  const [eventSource, setEventSource] = useState<HTMLElement>();
  useEffect(() => setEventSource(document.body), []);

  return (
    <div className="fixed inset-0 z-0" aria-hidden>
      <Canvas
        dpr={dpr}
        camera={{ position: [7, 7, 7], fov: 32, near: 0.5, far: 60 }}
        frameloop={reduced ? "demand" : "always"}
        performance={{ min: 0.5 }}
        gl={{ antialias: false, alpha: false, powerPreference: "high-performance", stencil: false }}
        eventSource={eventSource}
        eventPrefix="client"
        style={{ pointerEvents: "none" }}
        onCreated={({ gl }) => gl.setClearColor("#0b1f4f", 1)}
      >
        <color attach="background" args={["#0b1f4f"]} />
        <fog attach="fog" args={["#0b1f4f", 9, 24]} />
        <AdaptiveDpr pixelated />
        <PerformanceMonitor
          factor={1}
          flipflops={3}
          onChange={({ factor }) => setDpr(Math.round((0.75 + 0.75 * factor) * 4) / 4)}
          onDecline={() => setTier((t) => Math.max(0, t - 1) as 0 | 1 | 2)}
          onIncline={() => setTier((t) => Math.min(2, t + 1) as 0 | 1 | 2)}
          onFallback={() => { setTier(0); setDpr(1); }}
        />
        <Cluster />
        {!reduced && tier > 0 && (
          <EffectComposer multisampling={0} resolutionScale={tier === 2 ? 1 : 0.75}>
            <SMAA />
            <Bloom mipmapBlur intensity={0.75} luminanceThreshold={1} luminanceSmoothing={0.2} />
            <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.14} />
            <Vignette eskil={false} offset={0.2} darkness={0.7} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
