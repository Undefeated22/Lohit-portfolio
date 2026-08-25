"use client";

import { Canvas } from "@react-three/fiber";
import { motion, useScroll, useTransform } from "framer-motion";
import Core from "./Core";
import { useReducedMotionSafe } from "@/lib/motion";

// One persistent scene behind the whole page — the site's single world.
export default function Scene() {
  const reduced = useReducedMotionSafe();
  const { scrollYProgress } = useScroll();
  // mirrors the shader's rest glow and its smoothstep(0.82, 0.98) ignite —
  // the page and the core catch fire together
  const glow = useTransform(scrollYProgress, [0, 0.1, 0.82, 0.98], [0.16, 0.05, 0.05, 0.45]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 6.5], fov: 42 }}
        frameloop={reduced ? "demand" : "always"}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <Core />
      </Canvas>
      {/* the core's light spills onto the page, in sync with the shader */}
      <motion.div
        className="absolute inset-0"
        style={{
          opacity: reduced ? 0.08 : glow,
          mixBlendMode: "screen",
          background:
            "radial-gradient(55% 42% at 50% 55%, rgba(255,92,31,0.30), transparent 70%)",
        }}
      />
      {/* atmospheric vignette keeps edges quiet and type readable */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 45%, transparent 40%, rgba(10,10,11,0.75) 100%)",
        }}
      />
    </div>
  );
}
