"use client";

import { Reveal } from "./Reveal";

// A drawing's title block: sheet number, phase, title, and a right-hand
// readout — the same strip on every sheet, so the site reads as one set.
export default function SectionHeader({
  sheet,
  phase,
  title,
  sub,
  right,
}: {
  sheet: string;
  phase: string;
  title: string;
  sub?: string;
  right?: string;
}) {
  return (
    <Reveal>
      <div className="mb-14 border-y border-line">
        <div className="flex flex-wrap items-stretch">
          <div className="type-label flex items-center gap-3 border-r border-line py-3 pr-5">
            <span className="text-text">SHEET {sheet}</span>
            <span>/ 06</span>
          </div>
          <div className="type-label flex items-center border-r border-line px-5 py-3">
            PHASE — <span className="ml-2 text-text">{phase}</span>
          </div>
          {right && (
            <div className="type-label ml-auto hidden items-center py-3 md:flex">{right}</div>
          )}
        </div>
        <div className="border-t border-line py-6">
          <h2 className="type-h2 text-[clamp(1.75rem,4vw,3rem)]">{title}</h2>
          {sub && <p className="mt-3 max-w-[64ch] text-text-2">{sub}</p>}
        </div>
      </div>
    </Reveal>
  );
}
