"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { sim } from "@/lib/simStore";
import { replayRun, emit } from "@/lib/commands";
import { lenisRef } from "./SmoothScroll";
import { phaseStart } from "@/lib/sim";
import { EASE } from "@/lib/motion";

// A guided run for first-time operators: five stops, each scrolls the sheet
// to the right tick and waits for the real thing to happen. Step 2 waits for
// the visitor's own kill — the tour never fakes an event.
type Step = { title: string; body: string; go?: () => void; waitFor?: "kill" | "shrink"; autoMs?: number; cta?: string };

const goTick = (t: number, duration = 1.6) => {
  const y = sim.scrollForTick(t, window.innerHeight || 800);
  if (lenisRef) lenisRef.scrollTo(y, { duration }); else window.scrollTo({ top: y, behavior: "smooth" });
};

const STEPS: Step[] = [
  { title: "1 / 5 — THE SHEET", body: "This is a deterministic simulation of a shard cluster, run from the seed in the URL. Scroll is the clock — every tile, lease and workflow is a pure function of it.", go: () => goTick(60), autoMs: 5200, cta: "NEXT" },
  { title: "2 / 5 — KILL A NODE", body: "Press and hold any lit tile for a moment (or press K). That's a kill -9 on a node holding a lease.", go: () => goTick(phaseStart("lease") + 200), waitFor: "kill", cta: "SKIP" },
  { title: "3 / 5 — THE RECOVERY", body: "Watch the drawing: the lease moves to a neighbour with a higher token, the dead node comes back, and its stale write is fenced — the yellow caption. Nothing was lost.", go: () => goTick(sim.tick + 110, 4.5), autoMs: 6500, cta: "NEXT" },
  { title: "4 / 5 — SHRINK", body: "Delta debugging finds the smallest set of your faults that still breaks a shard — the same idea that turned 44 injected faults into 2 in dex.", go: () => goTick(phaseStart("shrink") + 120), waitFor: "shrink", autoMs: 7000, cta: "NEXT" },
  { title: "5 / 5 — YOUR RUN", body: "Everything you did is in the URL. Replay it from tick 0, print the sheet, turn sound on and hear it, or send the link so the next operator inherits your faults.", go: () => goTick(phaseStart("exit") + 60), cta: "REPLAY IT" },
];

export default function Tour() {
  const [step, setStep] = useState(-1);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const unsub = useRef<(() => void) | null>(null);

  const stop = () => {
    clearTimeout(timer.current);
    unsub.current?.();
    unsub.current = null;
    setStep(-1);
  };

  useEffect(() => {
    const start = () => setStep(0);
    window.addEventListener("lohit:tour", start);
    return () => window.removeEventListener("lohit:tour", start);
  }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    unsub.current?.();
    unsub.current = null;
    if (step < 0) return;
    const s = STEPS[step];
    s.go?.();
    const advance = () => setStep((k) => Math.min(STEPS.length - 1, k + 1));
    if (s.waitFor === "kill") {
      const n0 = sim.userFaults.length;
      unsub.current = sim.subscribe(() => { if (sim.userFaults.length > n0) { unsub.current?.(); unsub.current = null; setTimeout(advance, 900); } });
    } else if (s.waitFor === "shrink") {
      unsub.current = sim.subscribe(() => { if (sim.shrunk) { unsub.current?.(); unsub.current = null; timer.current = setTimeout(advance, 3200); } });
      if (s.autoMs) timer.current = setTimeout(advance, s.autoMs);
    } else if (s.autoMs) {
      timer.current = setTimeout(advance, s.autoMs);
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") stop(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const s = step >= 0 ? STEPS[step] : null;
  const last = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      {s && (
        <motion.aside
          data-ui
          role="dialog"
          aria-label="Guided run"
          className="fixed inset-x-4 bottom-16 z-[65] mx-auto max-w-[560px] border border-text bg-bg/95 p-4 shadow-hard-chalk backdrop-blur-md md:bottom-20 md:p-5"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 12, opacity: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <div className="type-label flex items-center justify-between">
            <span className="text-text">{s.title}</span>
            <button onClick={stop} className="link" aria-label="End the tour">END (ESC)</button>
          </div>
          <p key={step} className="mt-2 text-sm text-text-2">{s.body}</p>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => {
                if (last) { stop(); emit("lohit:notice", replayRun()); return; }
                setStep((k) => k + 1);
              }}
              className={`btn ${last ? "btn-primary" : ""}`}
            >
              {s.cta ?? "NEXT"}
            </button>
            {step > 0 && <button onClick={() => setStep((k) => k - 1)} className="type-label link">BACK</button>}
            <span className="ml-auto flex gap-1" aria-hidden>
              {STEPS.map((_, i) => <span key={i} className={`size-1.5 ${i <= step ? "bg-text" : "bg-line"}`} />)}
            </span>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
