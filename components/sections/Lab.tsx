"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { experiments } from "@/data/portfolio";
import { Reveal } from "../ui/Reveal";
import SectionHeader from "../ui/SectionHeader";

const STATUS_COLOR: Record<string, string> = {
  LIVE: "var(--color-ok)",
  WIP: "var(--color-ember)",
  ARCHIVED: "var(--color-fg-faint)",
};

// The laboratory: experiments as a constellation. Desktop draws the sky;
// mobile gets clean instrument rows instead of a cramped star map.
// Lines connect each node to its nearest neighbour — real spatial structure,
// not array order.
const links: [number, number][] = (() => {
  const pairs = new Set<string>();
  experiments.forEach((e, i) => {
    let best = -1;
    let bestD = Infinity;
    experiments.forEach((o, j) => {
      if (i === j) return;
      const d = (e.x - o.x) ** 2 + (e.y - o.y) ** 2;
      if (d < bestD) { bestD = d; best = j; }
    });
    pairs.add([Math.min(i, best), Math.max(i, best)].join("-"));
  });
  return [...pairs].map((k) => k.split("-").map(Number) as [number, number]);
})();

export default function Lab() {
  const [hover, setHover] = useState<number | null>(null);

  return (
    <section id="lab" aria-label="Experiments" className="relative px-5 py-32 md:px-10 md:py-44">
      <div className="mx-auto max-w-[1600px]">
        <SectionHeader
          index="03"
          label="THE LAB — EXPERIMENTS"
          right={`${experiments.length} SPECIMENS`}
          sub="Prototypes, studies and tools. Most die here. The survivors graduate."
        />

        {/* constellation — desktop */}
        <Reveal delay={0.15} className="hidden md:block">
          <div className="hairline relative mt-14 h-[560px] overflow-hidden rounded-sm">
            <svg className="absolute inset-0 h-full w-full" aria-hidden>
              {links.map(([a, b]) => (
                <line
                  key={`${a}-${b}`}
                  x1={`${experiments[a].x}%`}
                  y1={`${experiments[a].y}%`}
                  x2={`${experiments[b].x}%`}
                  y2={`${experiments[b].y}%`}
                  stroke="var(--color-line)"
                  strokeDasharray="3 5"
                />
              ))}
            </svg>

            {experiments.map((e, i) => (
              <div
                key={e.name}
                className="absolute"
                style={{ left: `${e.x}%`, top: `${e.y}%` }}
              >
                <a
                  href={e.href ?? "#"}
                  target={e.href?.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  data-cursor="VIEW"
                  aria-label={`${e.name} — ${e.category}, ${e.tech}, ${e.status}`}
                  className="group relative block -translate-x-1/2 -translate-y-1/2 p-3"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  onKeyDown={(evt) => {
                    if (evt.key === "Escape") evt.currentTarget.blur();
                  }}
                >
                  <span
                    className={`block size-2 rounded-full transition-transform duration-300 group-hover:scale-[1.8] ${
                      e.status === "LIVE" ? "pulse-dot" : ""
                    }`}
                    style={{
                      background: STATUS_COLOR[e.status],
                      opacity: e.status === "ARCHIVED" ? 0.45 : 1,
                    }}
                  />
                  <span
                    className="absolute left-1/2 top-1/2 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-opacity duration-300"
                    style={{
                      borderColor: STATUS_COLOR[e.status],
                      opacity: hover === i ? 0.5 : 0,
                    }}
                  />
                </a>

                <AnimatePresence>
                  {hover === i && (
                    <motion.div
                      className="glass hairline absolute left-4 top-4 z-10 w-56 rounded-sm p-4"
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        ...(e.x > 70 ? { left: "auto", right: "1rem" } : {}),
                        ...(e.y > 60 ? { top: "auto", bottom: "1rem" } : {}),
                      }}
                    >
                      <p className="font-mono text-[12px] tracking-wide text-fg">{e.name}</p>
                      <dl className="mt-2 space-y-1">
                        <div className="flex justify-between">
                          <dt className="type-label text-fg-faint">CATEGORY</dt>
                          <dd className="type-label text-fg-dim">{e.category}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="type-label text-fg-faint">TECH</dt>
                          <dd className="type-label text-fg-dim">{e.tech}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="type-label text-fg-faint">STATUS</dt>
                          <dd className="type-label" style={{ color: STATUS_COLOR[e.status] }}>
                            {e.status}
                          </dd>
                        </div>
                      </dl>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            <span className="type-label absolute bottom-4 left-4 text-fg-faint">
              FIG. 01 — ACTIVE EXPERIMENT FIELD
            </span>
            {/* register ticks, like a plate camera frame */}
            {["left-2 top-1", "right-2 top-1", "left-2 bottom-1", "right-2 bottom-1"].map((pos) => (
              <span key={pos} className={`absolute ${pos} select-none font-mono text-[10px] text-fg-faint/60`} aria-hidden>
                +
              </span>
            ))}
          </div>
        </Reveal>

        {/* instrument list — mobile */}
        <div className="mt-10 border-t border-line md:hidden">
          {experiments.map((e) => (
            <a
              key={e.name}
              href={e.href ?? "#"}
              className="flex items-center justify-between border-b border-line py-4"
            >
              <span className="flex items-center gap-3">
                <span className="size-1.5 rounded-full" style={{ background: STATUS_COLOR[e.status] }} />
                <span className="font-mono text-[12px] text-fg">{e.name}</span>
              </span>
              <span className="type-label text-fg-faint">{e.category}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
