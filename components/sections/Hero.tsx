"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { identity } from "@/data/portfolio";
import { RevealLines } from "../ui/Reveal";
import Magnetic from "../ui/Magnetic";
import { scrollToSection as go } from "../SmoothScroll";
import { EASE, useReducedMotionSafe } from "@/lib/motion";
import { world } from "@/lib/state";

// The signature interaction: hold to crash the core, release to watch it
// recover — the site's thesis (systems that survive failure) made physical.
function CrashTest() {
  const [phase, setPhase] = useState<"idle" | "crashing" | "recovered">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      world.crash = 0; // never leave the core crashed on unmount
    },
    []
  );

  const start = () => {
    clearTimeout(timer.current);
    world.crash = 1;
    setPhase("crashing");
  };
  const end = () => {
    if (world.crash === 0) return;
    world.crash = 0;
    setPhase("recovered");
    timer.current = setTimeout(() => setPhase("idle"), 2600);
  };

  const LABEL = {
    idle: "⏻ HOLD TO CRASH THE CORE",
    crashing: "CRASHING — EVENT LOG INTACT …",
    recovered: "RECOVERED — 0 EVENTS LOST",
  } as const;

  return (
    <motion.button
      className={`type-label mt-10 inline-flex items-center gap-2 transition-colors duration-300 ${
        phase === "crashing"
          ? "text-ember"
          : phase === "recovered"
            ? "text-ok"
            : "text-fg-faint hover:text-fg-dim"
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.5, duration: 1 }}
      onPointerDown={start}
      onPointerUp={end}
      onPointerLeave={end}
      onPointerCancel={end}
      onBlur={end}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !e.repeat) {
          e.preventDefault();
          start();
        }
      }}
      onKeyUp={(e) => (e.key === "Enter" || e.key === " ") && end()}
      onContextMenu={(e) => e.preventDefault()}
      aria-label="Hold to crash the core and watch it recover"
    >
      <span role="status">{LABEL[phase]}</span>
    </motion.button>
  );
}

export default function Hero() {
  const reduced = useReducedMotionSafe();

  return (
    <section
      id="top"
      aria-label="Introduction"
      className="relative flex min-h-svh flex-col justify-center px-5 md:px-10"
    >
      <div className="mx-auto w-full max-w-[1600px]">
        <motion.p
          className="type-label mb-6 flex items-center gap-2 md:mb-10"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <span className="size-1.5 rounded-full bg-ember pulse-dot" />
          SYSTEM ONLINE — PORTFOLIO / 2026
        </motion.p>

        {/* the name inverts against the core's glow — type living inside the scene */}
        <h1 className="type-display text-[clamp(4rem,17vw,16.5rem)] text-fg mix-blend-difference">
          <RevealLines
            lines={[
              <>
                {identity.name}
                <span className="text-ember">.</span>
              </>,
            ]}
            delay={0.1}
          />
          <RevealLines
            lines={identity.role.slice(0, -1)}
            delay={0.25}
            className="text-[clamp(2.2rem,8.5vw,8rem)]"
          />
          {/* last role line goes hollow — the core burns through the strokes,
              bookending the outline line in the contact finale */}
          <RevealLines
            lines={[identity.role[identity.role.length - 1]]}
            delay={0.4}
            className="type-outline text-[clamp(2.2rem,8.5vw,8rem)]"
          />
        </h1>

        <div className="mt-8 flex flex-col gap-8 md:mt-14 md:flex-row md:items-end md:justify-between">
          <div>
            <motion.p
              className="max-w-md whitespace-pre-line text-base leading-relaxed text-fg-dim md:text-lg"
              initial={reduced ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.7, ease: EASE }}
            >
              {identity.statement}
            </motion.p>
            {!reduced && <CrashTest />}
          </div>

          <motion.div
            className="flex items-center gap-3"
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.85, ease: EASE }}
          >
            <Magnetic>
              <button
                onClick={() => go("#work")}
                className="group flex items-center gap-3 rounded-full bg-fg px-7 py-3.5 font-mono text-[12px] tracking-[0.12em] text-bg transition-colors duration-300 hover:bg-ember"
              >
                EXPLORE WORK
                <span className="transition-transform duration-300 group-hover:translate-y-0.5">↓</span>
              </button>
            </Magnetic>
            <Magnetic>
              <button
                onClick={() => go("#contact")}
                className="hairline rounded-full px-7 py-3.5 font-mono text-[12px] tracking-[0.12em] text-fg transition-colors duration-300 hover:border-ember hover:text-ember"
              >
                CONTACT
              </button>
            </Magnetic>
          </motion.div>
        </div>
      </div>

      {/* coordinates on the right edge — HUD detail, desktop only */}
      <motion.span
        className="type-label absolute right-6 top-1/2 hidden -translate-y-1/2 text-[10px] text-fg-faint lg:block"
        style={{ writingMode: "vertical-rl" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3, duration: 1 }}
        aria-hidden
      >
        29.1492°N — 75.7217°E / HISAR, IN
      </motion.span>

      {/* scroll cue */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        aria-hidden
      >
        <div className="h-10 w-px overflow-hidden bg-line">
          <motion.div
            className="h-1/2 w-full bg-ember"
            animate={reduced ? undefined : { y: ["-100%", "220%"] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </section>
  );
}
