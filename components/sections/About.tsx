"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { about } from "@/data/portfolio";
import { Reveal } from "../ui/Reveal";
import SectionHeader from "../ui/SectionHeader";
import { world } from "@/lib/state";

const EASE = [0.16, 1, 0.3, 1] as const;

// Hovering a facet warms the 3D core behind the page (world.facet → shader).
export default function About() {
  const [active, setActive] = useState(0);

  const set = (i: number) => {
    setActive(i);
    world.facet = i;
  };

  return (
    <section
      id="about"
      aria-label="About"
      className="relative px-5 py-32 md:px-10 md:py-44"
    >
      <div className="mx-auto max-w-[1600px]">
        <SectionHeader index="02" label="ABOUT — THE OPERATOR" />
      </div>
      <div className="mx-auto grid max-w-[1600px] gap-16 md:grid-cols-2 md:gap-24">
        <div>
          <Reveal delay={0.1}>
            <p className="max-w-xl text-2xl leading-snug text-fg md:text-[2rem]">
              {about.intro}
            </p>
          </Reveal>
        </div>

        <div
          className="md:mt-24"
          onMouseLeave={() => (world.facet = -1)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) world.facet = -1;
          }}
        >
          <ul className="border-t border-line">
            {about.facets.map((f, i) => (
              <li key={f.key} className="border-b border-line">
                <button
                  className="group flex w-full items-baseline justify-between py-5 text-left"
                  onMouseEnter={() => set(i)}
                  onFocus={() => set(i)}
                  onClick={() => set(i)}
                  aria-current={active === i}
                >
                  <span
                    className={`type-display text-4xl transition-[color,transform] duration-300 md:text-6xl ${
                      active === i
                        ? "translate-x-2 text-fg md:translate-x-3"
                        : "text-fg-faint group-hover:text-fg-dim"
                    }`}
                  >
                    {f.key}
                  </span>
                  <span
                    className={`type-index text-[11px] transition-colors duration-300 ${
                      active === i ? "text-ember" : "text-fg-faint"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="relative mt-8 min-h-[7rem]" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                <h3 className="type-label mb-2 text-ember">{about.facets[active].title}</h3>
                <p className="max-w-md leading-relaxed text-fg-dim">
                  {about.facets[active].body}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
