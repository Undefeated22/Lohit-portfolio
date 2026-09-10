"use client";

import { motion } from "framer-motion";
import { identity } from "@/data/portfolio";
import { RevealLines } from "../ui/Reveal";
import { scrollToSection as go } from "../SmoothScroll";
import { emit } from "@/lib/commands";
import { sim } from "@/lib/simStore";
import { EASE, useReducedMotionSafe } from "@/lib/motion";
import { useEffect, useState } from "react";

// SHEET 01 — BOOT. Typography carries the hero; the cluster powers on
// behind it, tile by tile, in the order the seed decides.
export default function Hero() {
  const reduced = useReducedMotionSafe();
  const [seed, setSeed] = useState("");
  useEffect(() => {
    setSeed(sim.seedHex);
    return sim.subscribe(() => setSeed(sim.seedHex));
  }, []);
  const rise = (delay: number) => ({
    initial: reduced ? false : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.9, delay, ease: EASE },
  });

  return (
    <section
      id="top"
      data-phase="boot"
      aria-label="Introduction"
      className="relative flex min-h-svh flex-col justify-end px-5 pb-16 pt-28 md:px-8 md:pb-20"
    >
      {/* sheet corner: drawing metadata, tiny against the display type */}
      <motion.div {...rise(0.1)} className="type-label absolute left-5 top-20 flex flex-col gap-1 md:left-8">
        <span className="text-text">SHEET 01 / 06 — BOOT</span>
        <span>DETERMINISTIC RUN · SEED {seed}</span>
        <span>{identity.location.toUpperCase()}</span>
      </motion.div>
      <motion.span
        {...rise(0.3)}
        className="type-label absolute right-6 top-1/2 hidden -translate-y-1/2 text-[10px] lg:block"
        style={{ writingMode: "vertical-rl" }}
        aria-hidden
      >
        29.1492°N — 75.7217°E · SCALE 1:36 · REV 2026.09
      </motion.span>

      <div className="mx-auto w-full max-w-[1600px]">
        <h1 className="type-display text-[clamp(2.75rem,8.4vw,7.5rem)]">
          <RevealLines lines={[identity.name]} delay={0.1} />
          <RevealLines
            lines={[identity.role.join(" ")]}
            delay={0.25}
            className="text-[clamp(1.5rem,4.2vw,3.6rem)] font-medium text-text-2"
          />
        </h1>
        {/* dimension callout, as a drafter would measure the title */}
        <motion.div {...rise(0.5)} className="mt-5 max-w-[42ch]" aria-hidden>
          <div className="dim-line" />
          <div className="type-label mt-2 flex justify-between">
            <span>36 NODES · 6 WORKFLOWS</span>
            <span>SCALE 1:36 · SEED {seed}</span>
          </div>
        </motion.div>

        <div className="mt-10 grid gap-8 md:grid-cols-[minmax(0,52ch)_1fr] md:items-end">
          <motion.p {...rise(0.6)} className="max-w-[52ch] text-[15px] leading-relaxed text-text-2 md:text-base">
            {identity.statement}
          </motion.p>
          <motion.div {...rise(0.75)} className="flex flex-wrap items-center gap-3 md:justify-end">
            <button onClick={() => go("#about")} className="btn btn-primary">
              EXPLORE THE RUN ↓
            </button>
            <button onClick={() => emit("lohit:terminal")} className="btn">
              TERMINAL <kbd className="text-label">/</kbd>
            </button>
          </motion.div>
        </div>

        <motion.p {...rise(1.1)} className="type-note mt-10 max-w-[60ch]">
          This page is a simulation of a shard cluster, run from seed {seed}. Scroll advances the clock; scrolling
          back rewinds it. Hold any node to kill it — then watch the lease move and the stale write get fenced.
          The seed is in the URL: send it and anyone sees the same untouched run.
        </motion.p>
      </div>
    </section>
  );
}
