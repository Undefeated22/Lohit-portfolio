"use client";

import { useEffect, useRef, useState } from "react";
import { sim, useSimSelector, useHydrated } from "@/lib/simStore";
import { world } from "@/lib/state";
import { TOTAL_TICKS } from "@/lib/sim";

// The instrument readout. Tick is written straight to the DOM every frame
// (aria-hidden — screen readers get the narrative log instead); everything
// else is a rare React update. On phones it collapses to one line.
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
  const [hover, setHover] = useState<{ tile: number; hold: number; alive: boolean }>({ tile: -1, hold: 0, alive: true });
  const [replaying, setReplaying] = useState(false);

  const phase = useSimSelector((s) => s.phase);
  const faults = useSimSelector((s) => s.faults);
  const shrunk = useSimSelector((s) => s.shrunk);
  const hydrated = useHydrated();
  const logSizeNow = useSimSelector(() => sim.userFaults.length);
  const operatorsNow = useSimSelector(() => sim.operators);
  const logSize = hydrated ? logSizeNow : 0;
  const operators = hydrated ? operatorsNow : 0;
  const selected = useSimSelector(
    (s) => s.events.slice(-3),
    (a, b) => a.length === b.length && a.every((e, i) => e.tick === b[i].tick && e.text === b[i].text)
  );
  const events = hydrated ? selected : []; // node numbers come from the visitor's seed
  const [seed, setSeed] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const on = (e: Event) => {
      setNotice(String((e as CustomEvent).detail ?? ""));
      clearTimeout(t);
      t = setTimeout(() => setNotice(""), 2600);
    };
    window.addEventListener("lohit:notice", on);
    return () => { window.removeEventListener("lohit:notice", on); clearTimeout(t); };
  }, []);
  useEffect(() => {
    setSeed(sim.seedHex);
    return sim.subscribe(() => setSeed(sim.seedHex));
  }, []);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (tickEl.current) tickEl.current.textContent = String(sim.tick).padStart(6, "0");
      const t = world.hoverTile, h = world.holdProgress;
      const alive = t >= 0 ? !!sim.snapshot.alive[t] : true;
      setReplaying((r) => (r === world.replaying ? r : world.replaying));
      setHover((prev) => (prev.tile === t && prev.alive === alive && Math.abs(prev.hold - h) < 0.02 ? prev : { tile: t, hold: h, alive }));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const last = events[events.length - 1];

  return (
    <div data-ui className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-5 pb-4 md:px-8 md:pb-5">
      {/* phones: one line */}
      <div className="type-label flex items-center justify-between gap-4 md:hidden">
        <span>
          {replaying ? <span className="tag">REPLAY</span> : <span className="text-text">{PHASE_LABEL[phase]}</span>}
          {faults ? <span className="text-accent"> · {faults} faults</span> : null}
        </span>
        {(notice || last) && <span className={`truncate ${!notice && last?.kind === "fence" ? "text-accent" : ""}`}>{notice || last?.text}</span>}
      </div>

      {/* desktop: full readout */}
      <div className="hidden items-end justify-between gap-6 md:flex">
        <div className="type-label flex flex-wrap items-center gap-x-5 gap-y-1">
          <span>seed <span className="text-text">{seed}</span></span>
          <span aria-hidden>
            tick <span ref={tickEl} className="text-text tabular-nums">000000</span>
            <span>/{TOTAL_TICKS}</span>
          </span>
          <span>phase <span className="text-text">{PHASE_LABEL[phase]}</span></span>
          <span>faults <span className={faults ? "text-accent" : "text-text"}>{faults}</span></span>
          <span>log <span className="text-text">{logSize}</span></span>
          {operators > 1 && <span>ops <span className="text-text">{operators}</span></span>}
          {replaying && <span className="tag">REPLAY</span>}
          <span>
            shrunk{" "}
            <span className={shrunk !== null ? "text-accent" : "text-text"}>{shrunk === null ? "—" : `→ ${shrunk}`}</span>
          </span>
          {notice && <span className="text-text" role="status">{notice}</span>}
          {hover.tile >= 0 && (
            <span className={hover.alive ? "text-accent" : "text-label"}>
              {!hover.alive
                ? `node ${hover.tile} is down`
                : hover.hold > 0
                  ? `killing node ${hover.tile} …`
                  : `hold to kill node ${hover.tile}`}
              {hover.alive && (
                <span className="ml-2 inline-block h-[3px] w-16 bg-line align-middle">
                  <span className="block h-full bg-accent" style={{ width: `${hover.hold * 100}%` }} />
                </span>
              )}
            </span>
          )}
        </div>

        {/* the narrative log — the part screen readers hear */}
        <ol className="type-label flex flex-col items-end gap-0.5 text-right" aria-live="polite" aria-atomic="false">
          {events.map((e) => (
            <li key={`${e.tick}-${e.text}`} className={e.kind === "fence" ? "text-accent" : e.kind === "warn" ? "text-text" : ""}>
              <span className="tabular-nums">{String(e.tick).padStart(6, "0")}</span>
              {"  "}
              {e.text}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
