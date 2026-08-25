"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { projects, type Project } from "@/data/portfolio";
import { lenisRef } from "../SmoothScroll";
import { world } from "@/lib/state";
import { EASE, useReducedMotionSafe } from "@/lib/motion";

/* Signature motifs: each project's preview sketches its actual architecture —
   Forge converges alerts into a root cause, dex replays an event log,
   A4 broadcasts to connected clients. Honest diagrams, not decoration. */
function Motif({ p }: { p: Project }) {
  const c = (a: number) => `hsl(${p.hue} 75% 62% / ${a})`;
  if (p.slug === "forge") {
    // alert sources → investigation core
    const sources: [number, number][] = [
      [48, 42], [36, 120], [70, 196], [150, 28], [140, 222], [230, 30],
    ];
    return (
      <svg viewBox="0 0 400 250" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        {sources.map(([x, y], i) => (
          <g key={i}>
            <line x1={x} y1={y} x2={252} y2={128} stroke={c(0.22)} strokeDasharray="2 4" />
            <circle cx={x} cy={y} r={3.5} fill="none" stroke={c(0.6)} />
          </g>
        ))}
        <circle cx={252} cy={128} r={13} fill="none" stroke={c(0.8)} />
        <circle cx={252} cy={128} r={4} fill={c(0.9)} />
        <circle cx={252} cy={128} r={26} fill="none" stroke={c(0.25)} strokeDasharray="1 5" />
      </svg>
    );
  }
  if (p.slug === "dex") {
    // append-only event log with a replay head
    const ticks = Array.from({ length: 17 }, (_, i) => 36 + i * 20);
    return (
      <svg viewBox="0 0 400 250" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <line x1={24} y1={140} x2={376} y2={140} stroke={c(0.25)} />
        {ticks.map((x, i) => (
          <rect
            key={x}
            x={x}
            y={140 - (8 + ((i * 7) % 4) * 7)}
            width={5}
            height={8 + ((i * 7) % 4) * 7}
            fill={x < 240 ? c(0.55) : "none"}
            stroke={x < 240 ? "none" : c(0.4)}
          />
        ))}
        <line x1={246} y1={92} x2={246} y2={162} stroke={c(0.9)} />
        <text x={254} y={100} fill={c(0.75)} fontSize={10} fontFamily="monospace">REPLAY</text>
      </svg>
    );
  }
  if (p.slug === "a4-satta-king") {
    // one publish, every client hears it
    const clients = [22, 68, 118, 165, 205, 250, 298, 340];
    return (
      <svg viewBox="0 0 400 250" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        {[34, 62, 92, 124].map((r) => (
          <circle key={r} cx={200} cy={118} r={r} fill="none" stroke={c(0.16 + (124 - r) * 0.002)} strokeDasharray="3 6" />
        ))}
        <circle cx={200} cy={118} r={5} fill={c(0.9)} />
        {clients.map((a, i) => {
          const rad = (a / 360) * Math.PI * 2;
          const x = 200 + Math.cos(rad) * 124;
          const y = 118 + Math.sin(rad) * 124;
          return <circle key={i} cx={x} cy={y} r={3} fill="none" stroke={c(0.6)} />;
        })}
      </svg>
    );
  }
  // fallback: quiet dot grid
  return (
    <svg viewBox="0 0 400 250" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      {Array.from({ length: 60 }, (_, i) => (
        <circle key={i} cx={30 + (i % 10) * 38} cy={30 + Math.floor(i / 10) * 38} r={1.2} fill={c(0.3)} />
      ))}
    </svg>
  );
}

function Preview({ p, className }: { p: Project; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-sm hairline ${className ?? ""}`}
      style={{
        background: `
          radial-gradient(120% 90% at 20% 10%, hsl(${p.hue} 70% 52% / 0.32), transparent 55%),
          radial-gradient(90% 120% at 85% 90%, hsl(${p.hue} 80% 45% / 0.18), transparent 60%),
          linear-gradient(160deg, #131316 0%, #0b0b0d 70%)`,
      }}
    >
      <div className="absolute inset-0 opacity-70 transition-opacity duration-700 group-hover:opacity-100">
        <Motif p={p} />
      </div>
      {/* hover warm-up: the preview breathes toward its own hue */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
        style={{
          background: `radial-gradient(100% 80% at 30% 20%, hsl(${p.hue} 75% 55% / 0.20), transparent 60%)`,
        }}
      />
      <span
        className="type-index absolute -bottom-[0.18em] right-4 select-none text-[clamp(6rem,14vw,13rem)] font-medium leading-none"
        style={{ color: `hsl(${p.hue} 70% 60% / 0.16)` }}
        aria-hidden
      >
        {p.index}
      </span>
      <span className="type-label absolute left-4 top-4" style={{ color: `hsl(${p.hue} 60% 70% / 0.7)` }}>
        {p.slug.toUpperCase()} / {p.year}
      </span>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0 3px, rgba(255,255,255,0.012) 3px 4px)",
        }}
        aria-hidden
      />
    </div>
  );
}

function Panel({
  p,
  i,
  progress,
  count,
  still = false,
  onOpen,
}: {
  p: Project;
  i: number;
  progress: MotionValue<number>;
  count: number;
  still?: boolean;
  onOpen: () => void;
}) {
  // depth choreography: each panel scales/dims by distance from stage center.
  // WAAPI scroll timelines need ranges inside [0,1], so edge panels drop the
  // out-of-bounds side of their triangle.
  const center = count > 1 ? i / (count - 1) : 0;
  const spread = count > 1 ? 1 / (count - 1) : 1;
  const input = [
    ...(center > 0 ? [center - spread] : []),
    center,
    ...(center < 1 ? [center + spread] : []),
  ];
  const tri = (edge: number, mid: number) => [
    ...(center > 0 ? [edge] : []),
    mid,
    ...(center < 1 ? [edge] : []),
  ];
  const scale = useTransform(progress, input, tri(0.88, 1), { clamp: true });
  const opacity = useTransform(progress, input, tri(0.45, 1), { clamp: true });
  const parallax = useTransform(
    progress,
    [Math.max(0, center - spread), Math.min(1, center + spread)],
    ["6%", "-6%"],
    { clamp: true }
  );

  return (
    <motion.article
      style={still ? undefined : { scale, opacity }}
      className="group relative w-[86vw] shrink-0 md:w-[62vw] lg:w-[54vw]"
    >
      {/* stretched primary action keeps the h3/ul as real semantics outside
          the button — heading nav and list announcement stay intact */}
      <button
        data-cursor="OPEN"
        onClick={onOpen}
        aria-label={`Open case study: ${p.name}`}
        className="absolute inset-0 z-10"
      />
      <motion.div
        layoutId={still ? undefined : `preview-${p.slug}`}
        transition={{ layout: { duration: 0.7, ease: EASE } }}
        className="relative aspect-[16/10] overflow-hidden rounded-sm"
      >
        <motion.div
          style={still ? undefined : { y: parallax }}
          className="absolute -inset-y-[8%] inset-x-0"
        >
          <Preview p={p} className="h-full w-full" />
        </motion.div>
        <div className="absolute inset-0 bg-bg/0 transition-colors duration-500 group-hover:bg-bg/10" />
      </motion.div>

      <div className="mt-5 flex items-start justify-between gap-6">
        <div>
          <span className="type-label text-ember">{p.index}</span>
          <h3 className="type-display mt-1 text-3xl md:text-5xl">{p.name}</h3>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-fg-dim md:text-base">
            {p.tagline}
          </p>
        </div>
        <div className="hidden shrink-0 flex-col items-end gap-1 pt-1 md:flex">
          <span className="type-label">{p.role}</span>
          <span className="type-label text-fg-faint">{p.year}</span>
        </div>
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1" aria-label="Technologies">
        {p.tech.map((t) => (
          <li key={t} className="type-label text-fg-faint">
            {t}
          </li>
        ))}
      </ul>
    </motion.article>
  );
}

const MOVEMENTS: [string, keyof Project][] = [
  ["OVERVIEW", "overview"],
  ["PROBLEM", "problem"],
  ["THINKING", "thinking"],
  ["ARCHITECTURE", "architecture"],
  ["INTERFACE", "interfaceNotes"],
  ["TECHNOLOGY", "technology"],
  ["OUTCOME", "outcome"],
];

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function CaseStudy({
  p,
  onClose,
  onSwitch,
}: {
  p: Project;
  onClose: () => void;
  onSwitch: (p: Project) => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionSafe();
  const readRaw = useMotionValue(0);
  const read = useSpring(readRaw, { stiffness: 140, damping: 30, mass: 0.3 });

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    lenisRef?.stop();
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      if (e.key !== "Tab" || !dialogRef.current) return;
      // contain Tab inside the dialog
      const nodes = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      // focus parked on body (e.g. after clicking text) — pull it back in
      if (!dialogRef.current.contains(document.activeElement)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
        return;
      }
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      lenisRef?.start();
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [onClose]);

  // switching projects inside the dialog: rewind, and move focus to the new
  // heading so screen readers hear which project they just switched to
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    dialogRef.current?.scrollTo({ top: 0 });
    readRaw.set(0);
    if (firstRender.current) {
      firstRender.current = false;
      return; // initial open already focuses CLOSE
    }
    headingRef.current?.focus();
  }, [p.slug, readRaw]);

  const i = projects.findIndex((x) => x.slug === p.slug);
  const next = projects[(i + 1) % projects.length];

  return (
    <motion.div
      ref={dialogRef}
      data-lenis-prevent
      onScroll={(e) => {
        const el = e.currentTarget;
        const max = el.scrollHeight - el.clientHeight;
        readRaw.set(max > 0 ? el.scrollTop / max : 0);
      }}
      className="fixed inset-0 z-[70] overflow-y-auto bg-bg"
      role="dialog"
      aria-modal="true"
      aria-label={`${p.name} case study`}
      initial={{ y: "6%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "4%", opacity: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      <div className="glass sticky top-0 z-10 border-b border-line">
        <div className="flex items-center justify-between px-5 py-4 md:px-10">
          <span className="type-label">
            CASE STUDY — {p.index} / {p.year}
          </span>
          <button
            ref={closeRef}
            onClick={onClose}
            className="type-label link-line text-fg"
          >
            CLOSE ✕
          </button>
        </div>
        {/* how far into the story you are */}
        <motion.div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-px origin-left bg-ember"
          style={{ scaleX: reduced ? readRaw : read }}
        />
      </div>

      <div className="mx-auto max-w-[1200px] px-5 pb-32 md:px-10">
        <motion.h2
          ref={headingRef}
          tabIndex={-1}
          className="type-display mt-14 text-[clamp(2.8rem,9vw,7.5rem)] outline-none"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
        >
          {p.name}
        </motion.h2>
        <motion.p
          className="mt-4 max-w-2xl text-lg text-fg-dim"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.25, ease: EASE }}
        >
          {p.tagline}
        </motion.p>

        {/* the panel's preview plate morphs into this one — shared element */}
        <motion.div
          layoutId={reduced ? undefined : `preview-${p.slug}`}
          transition={{ layout: { duration: 0.7, ease: EASE } }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-12"
        >
          <Preview p={p} className="aspect-[16/8]" />
        </motion.div>

        <div className="mt-10 grid grid-cols-2 gap-6 border-y border-line py-6 md:grid-cols-4">
          <div>
            <span className="type-label text-fg-faint">ROLE</span>
            <p className="mt-1 text-sm">{p.role}</p>
          </div>
          <div>
            <span className="type-label text-fg-faint">YEAR</span>
            <p className="mt-1 text-sm">{p.year}</p>
          </div>
          <div className="col-span-2">
            <span className="type-label text-fg-faint">STACK</span>
            <p className="mt-1 text-sm">{p.tech.join(" · ")}</p>
          </div>
        </div>

        {MOVEMENTS.map(([label, key], i) => (
          <section
            key={label}
            className="mt-14 grid gap-4 border-t border-line pt-8 md:grid-cols-[220px_1fr] md:gap-10"
          >
            <h3>
              <span className="type-index block text-[13px] text-ember">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="type-label mt-1 block text-fg-faint">{label}</span>
            </h3>
            <div className="max-w-2xl">
              {label === "TECHNOLOGY" && (
                <ul className="mb-4 flex flex-wrap gap-2" aria-label="Stack">
                  {p.tech.map((t) => (
                    <li key={t} className="hairline rounded-full px-3.5 py-1.5 font-mono text-[11px] tracking-wide text-fg-dim">
                      {t}
                    </li>
                  ))}
                </ul>
              )}
              <p
                className={
                  label === "OVERVIEW"
                    ? "text-lg leading-relaxed text-fg"
                    : "leading-relaxed text-fg-dim"
                }
              >
                {String(p[key])}
              </p>
            </div>
          </section>
        ))}

        <div className="mt-20 flex flex-wrap gap-4">
          {p.live && (
            <a
              href={p.live}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-fg px-7 py-3.5 font-mono text-[12px] tracking-[0.12em] text-bg transition-colors hover:bg-ember"
            >
              LIVE DEMO ↗
            </a>
          )}
          {p.github && (
            <a
              href={p.github}
              target="_blank"
              rel="noreferrer"
              className="hairline rounded-full px-7 py-3.5 font-mono text-[12px] tracking-[0.12em] transition-colors hover:border-ember hover:text-ember"
            >
              GITHUB ↗
            </a>
          )}
        </div>

        {/* keep the reader in flow — the story continues into the next project */}
        <button
          onClick={() => onSwitch(next)}
          data-cursor="NEXT"
          className="group mt-24 flex w-full items-end justify-between gap-6 border-t border-line pt-8 text-left"
          aria-label={`Next case study: ${next.name}`}
        >
          <div>
            <span className="type-label text-fg-faint">NEXT CASE STUDY</span>
            <span className="type-display mt-2 block text-3xl transition-colors duration-300 group-hover:text-ember md:text-5xl">
              {next.name}
            </span>
          </div>
          <span className="type-index pb-1 text-[13px] text-ember transition-transform duration-300 group-hover:translate-x-1.5">
            {next.index} →
          </span>
        </button>
      </div>
    </motion.div>
  );
}

export default function Work() {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Project | null>(null);
  const closing = useRef(false);
  const reduced = useReducedMotionSafe();

  // case studies are URLs: #project/<slug> is shareable, the back button
  // closes the dialog, and landing on a deep link opens it directly.
  // `fromSite` lives in history.state (not a ref) so forward-button traversal
  // restores it, and `closing` guards Escape auto-repeat from firing
  // history.back() twice before popstate lands.
  const open = useCallback((p: Project) => {
    setActive(p);
    history.pushState({ fromSite: true }, "", `#project/${p.slug}`);
  }, []);

  const close = useCallback(() => {
    if (closing.current) return;
    if (history.state?.fromSite) {
      closing.current = true;
      history.back(); // popstate clears `active`
    } else {
      // arrived directly on the deep link — don't navigate away from the site
      history.replaceState(null, "", location.pathname + location.search);
      setActive(null);
    }
  }, []);

  const switchTo = useCallback((p: Project) => {
    setActive(p);
    // keep the entry's fromSite flag so close still knows how it was reached
    history.replaceState(history.state, "", `#project/${p.slug}`);
  }, []);

  useEffect(() => {
    const fromHash = () => {
      const m = location.hash.match(/^#project\/(.+)$/);
      return m ? projects.find((x) => x.slug === m[1]) ?? null : null;
    };
    const initial = fromHash();
    if (initial) setActive(initial);

    const onPop = () => {
      closing.current = false;
      setActive(fromHash());
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const { scrollYProgress } = useScroll({
    target: track,
    offset: ["start start", "end end"],
  });

  const n = projects.length;
  // shift formula mirrors the CSS: panel/gap/pad vary per breakpoint
  const [shift, setShift] = useState(0);
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      const panel = w < 768 ? 86 : w < 1024 ? 62 : 54;
      const gap = w < 768 ? 6 : 8;
      const pad = w < 768 ? 7 : 14;
      const content = panel * n + gap * (n - 1);
      setShift(Math.max(0, content + pad - 93));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [n]);

  const x = useTransform(scrollYProgress, [0, 1], ["0vw", `-${shift}vw`]);
  // live index readout + the core digests the centered project's hue
  const idx = useTransform(scrollYProgress, (v) =>
    String(Math.round(v * (n - 1)) + 1).padStart(2, "0")
  );
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    world.hue = projects[Math.round(v * (n - 1))].hue;
  });

  if (reduced) {
    // reduced motion: honest vertical list, no pinning. The track ref still
    // mounts here so useScroll never targets a missing element.
    return (
      <section id="work" aria-label="Selected work" className="relative px-5 py-28 md:px-10">
        <div ref={track} className="mx-auto max-w-[1600px]">
          <h2 className="type-label mb-14">
            SELECTED WORK — {String(n).padStart(2, "0")} PROJECTS
          </h2>
          <div className="flex flex-col gap-24">
            {projects.map((p) => (
              <Panel
                key={p.slug}
                p={p}
                i={0}
                count={1}
                still
                progress={scrollYProgress}
                onOpen={() => open(p)}
              />
            ))}
          </div>
        </div>
        <AnimatePresence>
          {active && <CaseStudy p={active} onClose={close} onSwitch={switchTo} />}
        </AnimatePresence>
      </section>
    );
  }

  return (
    <section id="work" aria-label="Selected work">
      {/* 72vh of travel per project — enough to breathe, never a slog */}
      <div ref={track} className="relative" style={{ height: `${110 + n * 72}vh` }}>
        <div className="sticky top-0 flex h-svh flex-col justify-center overflow-hidden">
          <div className="mb-10 px-5 md:px-10">
            <div className="mx-auto max-w-[1600px]">
              <div className="flex items-baseline justify-between">
                <h2 className="type-label">SELECTED WORK</h2>
                <span className="type-index text-[11px] text-fg-faint">
                  <motion.span className="text-ember">{idx}</motion.span>
                  {" / "}
                  {String(n).padStart(2, "0")} — SCROLL
                </span>
              </div>
              {/* rail fills as the track scrubs */}
              <motion.div
                aria-hidden
                className="mt-3 h-px w-full origin-left bg-ember/60"
                style={{ scaleX: scrollYProgress }}
              />
            </div>
          </div>
          <motion.div
            style={{ x }}
            className="flex gap-[6vw] pl-[7vw] md:gap-[8vw] md:pl-[14vw]"
          >
            {projects.map((p, i) => (
              <Panel
                key={p.slug}
                p={p}
                i={i}
                count={n}
                progress={scrollYProgress}
                onOpen={() => open(p)}
              />
            ))}
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {active && <CaseStudy p={active} onClose={close} onSwitch={switchTo} />}
      </AnimatePresence>
    </section>
  );
}
