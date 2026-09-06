"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { about, stack, projects } from "@/data/portfolio";
import { Reveal } from "../ui/Reveal";
import SectionHeader from "../ui/SectionHeader";
import { world } from "@/lib/state";
import { EASE } from "@/lib/motion";

// SHEET 02 — LEASE ACQUIRE. Four facets = four shard quadrants being
// claimed; hovering one lights its quadrant on the drawing. The stack is
// the sheet's bill of materials.
const usage = new Map<string, number>();
for (const p of projects) for (const t of p.tech) usage.set(t, (usage.get(t) ?? 0) + 1);

export default function About() {
  const [active, setActive] = useState(0);
  const set = (i: number) => { setActive(i); world.facet = i; };

  return (
    <section id="about" data-phase="lease" aria-label="About" className="relative bg-bg-deep/60 px-5 py-28 md:px-8 md:py-36">
      <div className="mx-auto max-w-[1600px]">
        <SectionHeader sheet="02" phase="LEASE ACQUIRE" title="The operator" right="4 QUADRANTS · 9 SHARDS EACH · TOKEN = 1" />

        <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20">
          <Reveal>
            <p className="type-h3 max-w-[30ch] text-[clamp(1.35rem,2.4vw,2rem)] leading-[1.25] text-text">{about.intro}</p>
            <p className="type-note mt-8">Hover a quadrant → its nine shards light up on the drawing.</p>
          </Reveal>

          <div
            className="grid grid-cols-2 gap-px bg-line"
            onMouseLeave={() => (world.facet = -1)}
            onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) world.facet = -1; }}
          >
            {about.facets.map((f, i) => (
              <button
                key={f.key}
                onMouseEnter={() => set(i)}
                onFocus={() => set(i)}
                onClick={() => set(i)}
                aria-current={active === i}
                className={`group relative min-h-[9rem] bg-bg p-5 text-left transition-colors duration-300 ${active === i ? "bg-surface" : "hover:bg-surface/60"}`}
              >
                <span className="type-label">QUADRANT {String(i).padStart(2, "0")}</span>
                <span className="type-h2 mt-3 block text-[clamp(1.4rem,2.6vw,2.2rem)] text-text">
                  {f.key}
                </span>
                <span className="type-label absolute right-4 top-5">{active === i ? "HELD" : "IDLE"}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative mt-10 min-h-[7rem] border-t border-line pt-6" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="grid gap-3 md:grid-cols-[220px_1fr]"
            >
              <h3 className="type-label text-text">{about.facets[active].title}</h3>
              <p className="max-w-[64ch] text-text-2">{about.facets[active].body}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* bill of materials */}
        <Reveal className="mt-24">
          <div className="type-label mb-4 flex items-baseline justify-between border-b border-line pb-3">
            <span className="text-text">BILL OF MATERIALS</span>
            <span>×N = SHIPPED IN N PROJECTS</span>
          </div>
          <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {stack.map((g) => (
              <div key={g.group} className="border-l border-line pl-4">
                <dt className="type-label text-text">{g.group}</dt>
                <dd className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                  {g.items.map((it) => {
                    const n = usage.get(it);
                    return (
                      <span key={it} className={n ? "text-text" : "text-label"}>
                        {it}{n ? <sup className="ml-0.5 text-[10px] text-label">×{n}</sup> : null}
                      </span>
                    );
                  })}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
