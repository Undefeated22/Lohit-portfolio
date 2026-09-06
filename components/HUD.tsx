"use client";

import { useEffect, useRef, useState } from "react";
import { sim, useSimSelector } from "@/lib/simStore";
import { world } from "@/lib/state";
import { TOTAL_TICKS } from "@/lib/sim";

// The instrument readout: seed, tick, phase, faults, last events.
// Tick is written straight to the DOM every frame; everything else is a
// rare React update. Narrates the simulator in plain words.
const PHASE_LABEL: Record<string, string> = {
  boot: "BOOT",
  lease: "LEASE ACQUIRE",
  workflows: "WORKFLOWS",
  faults: "FAULT INJECTION",
  shrink: "SHRINK",
  exit: "EXIT 0",
};

export default function HUD() {
  const tickEl = useRef<HTMLSpanElement>(null);
  const holdEl = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ tile: number; hold: number }>({ tile: -1, hold: 0 });

  const phase = useSimSelector((s) => s.phase);
  const faults = useSimSelector((s) => s.faults);
  const shrunk = useSimSelector((s) => s.shrunk);
  const events = useSimSelector(
    (s) => s.events.slice(-3),
    (a, b) => a.length === b.length && a.every((e, i) => e.tick === b[i].tick && e.text === b[i].text)
  );
  const seed = sim.seedHex;

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (tickEl.current) tickEl.current.textContent = String(sim.tick).padStart(6, "0");
      const t = world.hoverTile, h = world.holdProgress;
      setHover((prev) => (prev.tile === t && Math.abs(prev.hold - h) < 0.02 ? prev : { tile: t, hold: h }));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      data-ui
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 hidden px-5 pb-5 md:block md:px-8"
      aria-live="polite"
    >
      <div className="flex items-end justify-between gap-6">
        {/* readout */}
        <div className="type-label flex flex-wrap items-center gap-x-5 gap-y-1 text-label">
          <span>
            seed <span className="text-text">{seed}</span>
          </span>
          <span>
            tick <span ref={tickEl} className="text-text tabular-nums">000000</span>
            <span className="text-label">/{TOTAL_TICKS}</span>
          </span>
          <span>
            phase <span className="text-text">{PHASE_LABEL[phase]}</span>
          </span>
          <span>
            faults <span className={faults ? "text-accent" : "text-text"}>{faults}</span>
          </span>
          <span>
            shrunk{" "}
            <span className={shrunk !== null ? "text-accent" : "text-text"}>
              {shrunk === null ? "—" : `→ ${shrunk}`}
            </span>
          </span>
          {hover.tile >= 0 && (
            <span className="text-accent">
              {hover.hold > 0 ? `killing node ${hover.tile} …` : `hold to kill node ${hover.tile}`}
              <span
                ref={holdEl}
                className="ml-2 inline-block h-[3px] w-16 bg-line align-middle"
              >
                <span className="block h-full bg-accent" style={{ width: `${hover.hold * 100}%` }} />
              </span>
            </span>
          )}
        </div>

        {/* narrative log */}
        <ol className="type-label flex flex-col items-end gap-0.5 text-right">
          {events.map((e) => (
            <li
              key={`${e.tick}-${e.text}`}
              className={e.kind === "fence" ? "text-accent" : e.kind === "warn" ? "text-text" : "text-label"}
            >
              <span className="tabular-nums text-label">{String(e.tick).padStart(6, "0")}</span>
              {"  "}
              {e.text}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
