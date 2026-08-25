"use client";

import { Reveal } from "./Reveal";

// Shared section header: mono label left, oversized ghost index floating
// behind the top-right — gives each section a depth anchor and a number
// in the site's running order.
export default function SectionHeader({
  index,
  label,
  sub,
  right,
}: {
  index: string;
  label: string;
  sub?: string;
  right?: string;
}) {
  return (
    <div className="relative mb-14">
      <span
        aria-hidden
        className="type-index pointer-events-none absolute -top-16 right-0 select-none text-[clamp(6rem,11vw,10rem)] font-medium leading-none text-fg/[0.05] md:-top-24"
      >
        {index}
      </span>
      <Reveal>
        <div className="flex items-baseline justify-between gap-6">
          <h2 className="type-label">{label}</h2>
          {right && (
            <span className="type-index relative text-[11px] text-fg-faint">{right}</span>
          )}
        </div>
      </Reveal>
      {sub && (
        <Reveal delay={0.08}>
          <p className="mt-4 max-w-md text-fg-dim">{sub}</p>
        </Reveal>
      )}
    </div>
  );
}
