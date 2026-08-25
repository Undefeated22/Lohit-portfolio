"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { journey, education } from "@/data/portfolio";
import { Reveal } from "../ui/Reveal";
import SectionHeader from "../ui/SectionHeader";

// Typeset as an actual log: status tokens, mono timestamps, and a progress
// line that draws itself down the section as you scroll it.
export default function Journey() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 75%", "end 60%"],
  });
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section aria-label="Experience" className="relative px-5 py-32 md:px-10 md:py-44">
      <div className="mx-auto max-w-[1600px]">
        <SectionHeader index="05" label="THE JOURNEY — RUNTIME LOG" />

        <div ref={ref} className="relative ml-1">
          <div className="absolute inset-y-0 left-0 w-px bg-line" aria-hidden />
          <motion.div
            className="absolute left-0 top-0 w-px origin-top bg-ember"
            style={{ scaleY, height: "100%" }}
            aria-hidden
          />

          <ol className="space-y-16 pl-8 md:pl-16">
            {journey.map((m, i) => (
              <li key={i} className="relative">
                {/* log delimiter committed as the ember line passes it */}
                <span
                  aria-hidden
                  className={`absolute -left-8 top-2 size-[5px] -translate-x-1/2 rotate-45 md:-left-16 ${
                    m.status === "ACTIVE" ? "bg-ember" : "bg-fg-faint"
                  }`}
                />
                <Reveal delay={0.05}>
                  <div className="grid gap-2 md:grid-cols-[220px_1fr] md:gap-10">
                    <div className="flex flex-col gap-1.5">
                      <span className="type-index text-[12px] text-ember">{m.period}</span>
                      <span className="type-label flex items-center gap-2 text-fg-faint">
                        {m.status === "ACTIVE" ? (
                          <span className="size-1.5 rounded-full bg-ok pulse-dot" aria-hidden />
                        ) : (
                          <span className="size-1.5 rounded-full bg-fg-faint" aria-hidden />
                        )}
                        {m.status}
                      </span>
                    </div>
                    <div>
                      <h3 className="type-display text-2xl md:text-3xl">{m.role}</h3>
                      <p className="type-label mt-1.5">{m.org}</p>
                      <p className="mt-3 max-w-lg text-sm leading-relaxed text-fg-dim">
                        {m.note}
                      </p>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>

          {/* education runs on its own track below the work log */}
          <Reveal delay={0.05}>
            <div className="mt-20 grid gap-2 border-t border-line pl-8 pt-10 md:grid-cols-[220px_1fr] md:gap-10 md:pl-16">
              <div className="flex flex-col gap-1.5">
                <span className="type-index text-[12px] text-ember">{education.period}</span>
                <span className="type-label text-fg-faint">EDUCATION</span>
              </div>
              <div>
                <h3 className="type-display text-2xl md:text-3xl">{education.degree}</h3>
                <p className="type-label mt-1.5">{education.school}</p>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-fg-dim">
                  {education.note}
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
