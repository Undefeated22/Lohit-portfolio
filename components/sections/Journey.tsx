"use client";

import { useEffect, useState } from "react";
import { journey, education } from "@/data/portfolio";
import { Reveal } from "../ui/Reveal";
import SectionHeader from "../ui/SectionHeader";
import { sim, useSimSelector } from "@/lib/simStore";

// SHEET 05 — SHRINK. The sheet performs its phase: when the run reaches
// SHRINK with faults injected, ddmin runs on its own and the readout shows
// the minimal failing set. The button re-runs it.
function Shrinker() {
  const faults = useSimSelector((s) => s.faults);
  const phase = useSimSelector((s) => s.phase);
  const [result, setResult] = useState<ReturnType<typeof sim.shrink> | null>(null);
  useEffect(() => {
    if (phase === "shrink" && faults > 0 && !sim.shrunk) setResult(sim.shrink());
  }, [phase, faults]);
  return (
    <div className="rule bg-bg p-5 md:p-6">
      <div className="type-label mb-4 flex items-baseline justify-between">
        <span className="text-text">SHRINK INSTRUMENT</span>
        <span>ddmin · illustrative model of dex's simulator</span>
      </div>
      <p className="max-w-[60ch] text-sm text-text-2">
        {faults === 0
          ? "No faults in this run yet. Hold any node on the drawing to kill it (or press K), then this sheet shrinks them."
          : `${faults} fault${faults === 1 ? "" : "s"} injected so far — including the seed's own chaos. Shrink finds the smallest subset that still makes a shard unavailable.`}
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button onClick={() => setResult(sim.shrink())} disabled={faults === 0} className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-40">
          {result ? "SHRINK AGAIN" : "SHRINK FAULTS"}
        </button>
        <button onClick={() => sim.killAny()} className="btn">KILL A NODE</button>
      </div>
      <div role="status" className="mt-5 min-h-[1.5rem] font-mono text-sm">
        {result && (result.from === 0 ? (
          <span className="text-label">nothing to shrink</span>
        ) : result.to === 0 ? (
          <span className="text-text-2">{result.from} faults, but the cluster never lost a shard — every lease found a live neighbour.</span>
        ) : (
          <span className="text-text">
            <span className="text-accent">{result.from} → {result.to}</span> in {result.steps} runs · minimal set: nodes {result.tiles.join(", ")}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Journey() {
  const faults = useSimSelector((s) => s.faults);
  const shrunk = useSimSelector((s) => s.shrunk);
  return (
    <section id="journey" data-phase="shrink" aria-label="Experience" className="relative px-5 py-28 md:px-8 md:py-36">
      <div className="mx-auto max-w-[1600px]">
        <SectionHeader
          sheet="05"
          phase="SHRINK"
          title="Runtime log"
          right={shrunk !== null ? `SHRUNK ${faults} → ${shrunk}` : `${faults} FAULTS · NOT YET SHRUNK`}
        />
        <div className="grid gap-16 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div>
            <ol className="border-t border-line">
              {journey.map((m, i) => (
                <li key={i} className="grid gap-3 border-b border-line py-8 md:grid-cols-[220px_1fr] md:gap-10">
                  <Reveal>
                    <span className="type-index block text-text">{m.period}</span>
                    <span className="type-label mt-1 flex items-center gap-2">
                      <span className={`size-1.5 ${m.status === "ACTIVE" ? "bg-text" : "bg-label"}`} aria-hidden />
                      {m.status}
                    </span>
                  </Reveal>
                  <Reveal delay={0.05}>
                    <h3 className="type-h3 text-xl md:text-2xl">{m.role}</h3>
                    <p className="type-label mt-1">{m.org}</p>
                    <p className="mt-3 max-w-[60ch] text-sm text-text-2">{m.note}</p>
                  </Reveal>
                </li>
              ))}
              <li className="grid gap-3 py-8 md:grid-cols-[220px_1fr] md:gap-10">
                <Reveal>
                  <span className="type-index block text-text">{education.period}</span>
                  <span className="type-label mt-1 block">EDUCATION</span>
                </Reveal>
                <Reveal delay={0.05}>
                  <h3 className="type-h3 text-xl md:text-2xl">{education.degree}</h3>
                  <p className="type-label mt-1">{education.school}</p>
                  <p className="mt-3 max-w-[60ch] text-sm text-text-2">{education.note}</p>
                </Reveal>
              </li>
            </ol>
          </div>
          <Reveal delay={0.1}><Shrinker /></Reveal>
        </div>
      </div>
    </section>
  );
}
