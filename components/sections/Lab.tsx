"use client";

import { experiments, socials } from "@/data/portfolio";
import { Reveal } from "../ui/Reveal";
import SectionHeader from "../ui/SectionHeader";
import { useGithubFeed, ago, GITHUB_ACCOUNTS } from "@/lib/github";
import { useSimSelector } from "@/lib/simStore";

// SHEET 04 — FAULT INJECTION. The simulator injects chaos deterministically
// during this phase; the lab lists experiments as injected faults with an
// honest status. Recent public GitHub activity is the proof of life.
const STATUS: Record<string, { label: string; cls: string }> = {
  LIVE: { label: "LIVE", cls: "bg-accent text-bg" },
  WIP: { label: "IN FLIGHT", cls: "border border-accent text-accent" },
  ARCHIVED: { label: "WON'T FIX", cls: "border border-line text-label" },
};

function GhFeed() {
  const { events, error } = useGithubFeed(8);
  return (
    <div className="border-t border-line pt-4">
      <div className="type-label mb-3 flex items-baseline justify-between">
        <span className="text-text">RECENT PUBLIC EVENTS</span>
        <span>{GITHUB_ACCOUNTS.join(" + ")} · delayed up to 6h</span>
      </div>
      {events === null && !error && (
        <ul className="space-y-2" aria-busy>
          {[0, 1, 2, 3].map((i) => <li key={i} className="h-4 w-2/3 animate-pulse bg-surface" />)}
        </ul>
      )}
      {error && (
        <p className="text-sm text-label">
          feed unavailable (offline or rate-limited) — see{" "}
          <a className="link text-text" href={socials[0].href} target="_blank" rel="noreferrer">github.com/{GITHUB_ACCOUNTS[0]}</a>
        </p>
      )}
      {events && (
        <ol className="font-mono text-[13px]">
          {events.map((e) => (
            <li key={e.id} className="grid grid-cols-[3.5rem_1fr] gap-3 border-b border-line/60 py-1.5 sm:grid-cols-[3.5rem_minmax(0,1fr)_auto]">
              <span className="text-label">{ago(e.at)}</span>
              <a className="link truncate text-text" href={`https://github.com/${e.repo}`} target="_blank" rel="noreferrer">{e.repo}</a>
              <span className="text-text-2 sm:text-right">{e.detail}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default function Lab() {
  const faults = useSimSelector((s) => s.faults);
  return (
    <section id="lab" data-phase="faults" aria-label="Experiments" className="relative bg-bg-deep/60 px-5 py-28 md:px-8 md:py-36">
      <div className="mx-auto max-w-[1600px]">
        <SectionHeader
          sheet="04"
          phase="FAULT INJECTION"
          title="The lab"
          sub="Chaos is being injected into the cluster behind this sheet — deterministically, from the seed. The yellow stakes mark dead nodes. Below: the experiments, filed with their honest status."
          right={`FAULTS INJECTED SO FAR · ${faults}`}
        />

        <div className="grid gap-16 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <Reveal>
            <ol className="border-t border-line">
              {experiments.map((e, i) => {
                const st = STATUS[e.status];
                return (
                  <li key={e.name} className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 border-b border-line py-4 md:grid-cols-[3rem_1fr_1fr_auto]">
                    <span className="type-index text-[12px] text-label">F{String(i + 1).padStart(2, "0")}</span>
                    <a href={e.href ?? "#"} target={e.href?.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="link font-mono text-sm text-text">
                      {e.name}
                    </a>
                    <span className="type-label hidden md:block">{e.category} · {e.tech}</span>
                    <span className={`type-label px-2 py-1 ${st.cls}`}>{st.label}</span>
                  </li>
                );
              })}
            </ol>
            <p className="type-note mt-6">Most experiments die here. The lessons compound.</p>
          </Reveal>
          <Reveal delay={0.1}>
            <GhFeed />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
