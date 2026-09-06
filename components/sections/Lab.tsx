"use client";

import { experiments, socials } from "@/data/portfolio";
import { Reveal } from "../ui/Reveal";
import SectionHeader from "../ui/SectionHeader";
import { useGithubFeed, ago, GITHUB_ACCOUNTS } from "@/lib/github";
import { sim, useSimSelector } from "@/lib/simStore";
import { phaseStart } from "@/lib/sim";

// SHEET 04 — FAULT INJECTION. The lab IS the injection schedule: each
// experiment row is bound to one of the seed's chaos faults and fires as
// the run reaches its tick. Archived work is the dead node — caution.
const STATUS: Record<string, { label: string; cls: string }> = {
  LIVE: { label: "LIVE", cls: "bg-text text-bg" },
  WIP: { label: "IN FLIGHT", cls: "border border-line text-text-2" },
  ARCHIVED: { label: "WON'T FIX", cls: "border border-accent text-accent" },
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
          {[0, 1, 2, 3].map((i) => <li key={i} className="h-4 w-2/3 animate-pulse bg-surface motion-reduce:animate-none" />)}
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

function Row({ i, name, category, tech, status, href }: { i: number } & (typeof experiments)[number]) {
  const chaos = sim.run.chaos[i];
  const at = chaos ? phaseStart("faults") + chaos.at : null;
  const fired = useSimSelector((s) => (at === null ? true : s.tick >= at));
  const st = STATUS[status];
  return (
    <li
      className={`grid grid-cols-[4.5rem_1fr_auto] items-center gap-4 border-b border-line py-4 transition-opacity duration-500 md:grid-cols-[4.5rem_1fr_1fr_auto] ${fired ? "" : "opacity-40"}`}
    >
      <span className="type-index text-label">{at === null ? `F${String(i + 1).padStart(2, "0")}` : String(at).padStart(6, "0")}</span>
      <a href={href ?? "#"} target={href?.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="link font-mono text-sm text-text">
        {name}
      </a>
      <span className="type-label hidden md:block">{category} · {tech}</span>
      <span className={`type-label px-2 py-1 ${st.cls}`}>{st.label}</span>
    </li>
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
          sub="This sheet is the injection schedule. Each row is one of the seed's chaos faults — it fires when the run reaches its tick and a yellow stake goes up on the drawing. Archived experiments wear the same colour: they are the dead nodes."
          right={`FAULTS INJECTED SO FAR · ${faults}`}
        />

        <div className="grid gap-16 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <Reveal>
            <ol className="border-t border-line">
              {experiments.map((e, i) => <Row key={e.name} i={i} {...e} />)}
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
