"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { projects, type Project } from "@/data/portfolio";
import { diagrams } from "@/data/diagrams";
import Diagram from "../ui/Diagram";
import { Reveal } from "../ui/Reveal";
import SectionHeader from "../ui/SectionHeader";
import { lenisRef } from "../SmoothScroll";
import { world } from "@/lib/state";
import { EASE, useReducedMotionSafe } from "@/lib/motion";

// SHEET 03 — WORKFLOWS. Five workflows crawl the cluster; five sheets in
// the drawing index. A case study opens as that workflow's event history.
const MOVEMENTS: [string, keyof Project][] = [
  ["OVERVIEW", "overview"],
  ["PROBLEM", "problem"],
  ["THINKING", "thinking"],
  ["ARCHITECTURE", "architecture"],
  ["INTERFACE", "interfaceNotes"],
  ["TECHNOLOGY", "technology"],
  ["OUTCOME", "outcome"],
];
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function Sheet({ p, onOpen }: { p: Project; onOpen: () => void }) {
  return (
    <Reveal>
      <article className="group relative border-b border-line">
        <button
          onClick={onOpen}
          aria-label={`Open case study: ${p.name}`}
          className="absolute inset-0 z-10 focus-visible:outline-accent"
        />
        <div className="grid gap-6 py-10 transition-colors duration-300 group-hover:bg-surface/40 md:grid-cols-[120px_1fr_auto] md:gap-10 md:py-12">
          <div className="flex items-start gap-4 md:block">
            <span className="type-dim text-[clamp(3rem,7vw,6rem)] text-text-2">{p.index}</span>
            <span className="mt-2 block size-3 md:mt-4" style={{ background: `hsl(${p.hue} 85% 62%)` }} aria-hidden />
          </div>
          <div>
            <span className="type-label">SHEET 03.{p.index} · {p.year} · {p.role}</span>
            <h3 className="type-h2 mt-2 text-[clamp(1.8rem,4vw,3.4rem)]">{p.name}</h3>
            <p className="mt-3 max-w-[60ch] text-text-2">{p.tagline}</p>
            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1" aria-label="Technologies">
              {p.tech.map((t) => <li key={t} className="type-label">{t}</li>)}
            </ul>
          </div>
          <div className="type-label flex items-end gap-2 self-end text-text">OPEN →</div>
        </div>
      </article>
    </Reveal>
  );
}

function CaseStudy({ p, onClose, onSwitch }: { p: Project; onClose: () => void; onSwitch: (p: Project) => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const reduced = useReducedMotionSafe();
  const readRaw = useMotionValue(0);
  const read = useSpring(readRaw, { stiffness: 140, damping: 30, mass: 0.3 });

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    lenisRef?.stop();
    document.body.style.overflow = "hidden";
    world.project = p.slug;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { if (document.querySelector("dialog[open]")) return; return onClose(); }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const nodes = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes.length) return;
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (!dialogRef.current.contains(document.activeElement)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); return; }
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      lenisRef?.start();
      document.body.style.overflow = "";
      world.project = null;
      window.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  useEffect(() => {
    world.project = p.slug;
    dialogRef.current?.scrollTo({ top: 0 });
    readRaw.set(0);
    if (firstRender.current) { firstRender.current = false; return; }
    headingRef.current?.focus();
  }, [p.slug, readRaw]);

  const i = projects.findIndex((x) => x.slug === p.slug);
  const next = projects[(i + 1) % projects.length];
  const diagram = diagrams[p.slug];

  return (
    <motion.div
      ref={dialogRef}
      data-ui
      data-lenis-prevent
      onScroll={(e) => { const el = e.currentTarget; const max = el.scrollHeight - el.clientHeight; readRaw.set(max > 0 ? el.scrollTop / max : 0); }}
      className="fixed inset-0 z-[70] overflow-y-auto bg-[linear-gradient(to_bottom,rgba(11,31,79,0.55),rgba(11,31,79,0.96)_40vh)]"
      role="dialog"
      aria-modal="true"
      aria-label={`${p.name} case study`}
      initial={{ opacity: 0, y: "3%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "2%" }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <div className="sticky top-0 z-10 border-b border-text bg-bg/90 backdrop-blur-md">
        <div className="flex items-center justify-between px-5 py-3 md:px-8">
          <span className="type-label text-text">WORKFLOW {p.index} — {p.slug} · EVENT HISTORY</span>
          <button ref={closeRef} onClick={onClose} className="type-label link text-text">CLOSE ✕</button>
        </div>
        <motion.div aria-hidden className="absolute inset-x-0 bottom-0 h-px origin-left bg-accent" style={{ scaleX: reduced ? readRaw : read }} />
      </div>

      <div className="mx-auto max-w-[1200px] px-5 pb-32 md:px-8">
        <div className="type-label mt-12 flex flex-wrap gap-x-6 gap-y-1">
          <span>SHEET 03.{p.index}</span><span>{p.year}</span><span>{p.role}</span>
          <span className="flex items-center gap-2"><span className="size-2" style={{ background: `hsl(${p.hue} 85% 62%)` }} /> HUE {p.hue}°</span>
        </div>
        <h2 ref={headingRef} tabIndex={-1} className="type-display mt-4 text-[clamp(2.5rem,7vw,6rem)] outline-none">{p.name}</h2>
        <p className="mt-4 max-w-[60ch] text-lg text-text-2">{p.tagline}</p>

        {diagram && (
          <div className="mt-12">
            <div className="type-label mb-3 flex items-baseline justify-between"><span className="text-text">ARCHITECTURE</span><span>hover or focus a node · click to pin</span></div>
            <Diagram data={diagram} title={p.name} />
          </div>
        )}

        <ol className="mt-14 border-t border-line">
          {MOVEMENTS.map(([label, key], k) => (
            <li key={label} className="grid gap-3 border-b border-line py-8 md:grid-cols-[260px_1fr] md:gap-10">
              <div>
                <span className="type-index block text-text">seq {String(k + 1).padStart(3, "0")}</span>
                <span className="type-label mt-1 block">{label}</span>
              </div>
              <p className={`max-w-[64ch] ${k === 0 ? "text-lg leading-relaxed text-text" : "text-text-2"}`}>{String(p[key])}</p>
            </li>
          ))}
          {(p.live || p.github) && (
            <li className="grid gap-3 py-8 md:grid-cols-[260px_1fr] md:gap-10">
              <div>
                <span className="type-index block text-text">seq {String(MOVEMENTS.length + 1).padStart(3, "0")}</span>
                <span className="type-label mt-1 block">LINKS</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {p.live && <a href={p.live} target="_blank" rel="noreferrer" className="btn btn-primary">LIVE ↗</a>}
                {p.github && <a href={p.github} target="_blank" rel="noreferrer" className="btn">GITHUB ↗</a>}
              </div>
            </li>
          )}
        </ol>

        <button onClick={() => onSwitch(next)} className="group mt-16 flex w-full items-end justify-between gap-6 border-t border-text pt-8 text-left" aria-label={`Next case study: ${next.name}`}>
          <div>
            <span className="type-label">NEXT WORKFLOW</span>
            <span className="type-h2 mt-2 block text-[clamp(1.6rem,4vw,3rem)] transition-colors group-hover:text-text-2">{next.name}</span>
          </div>
          <span className="type-index text-text">{next.index} →</span>
        </button>
      </div>
    </motion.div>
  );
}

export default function Work() {
  const [active, setActive] = useState<Project | null>(null);
  const closing = useRef(false);

  const open = useCallback((p: Project) => {
    setActive(p);
    history.pushState({ fromSite: true }, "", `#project/${p.slug}`);
  }, []);
  const close = useCallback(() => {
    if (closing.current) return;
    if (history.state?.fromSite) { closing.current = true; history.back(); }
    else { history.replaceState(null, "", location.pathname + location.search); setActive(null); }
  }, []);
  const switchTo = useCallback((p: Project) => {
    setActive(p);
    history.replaceState(history.state, "", `#project/${p.slug}`);
  }, []);

  useEffect(() => {
    const fromHash = () => {
      const m = location.hash.match(/^#project\/(.+)$/);
      return m ? projects.find((x) => x.slug === m[1]) ?? null : null;
    };
    const initial = fromHash();
    if (initial) setActive(initial);
    const onPop = () => { closing.current = false; setActive(fromHash()); };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return (
    <section id="work" data-phase="workflows" aria-label="Selected work" className="relative px-5 py-28 md:px-8 md:py-36">
      <div className="mx-auto max-w-[1600px]">
        <SectionHeader
          sheet="03"
          phase="WORKFLOWS"
          title="Drawing index"
          sub="Six workflows are crawling the cluster behind this sheet — each colour is a project. Open one and the camera drops onto its path."
          right={`${projects.length} WORKFLOWS · ${projects.filter((p) => p.live).length} LIVE`}
        />
        <div className="border-t border-line">
          {projects.map((p) => <Sheet key={p.slug} p={p} onOpen={() => open(p)} />)}
        </div>
      </div>
      <AnimatePresence>{active && <CaseStudy p={active} onClose={close} onSwitch={switchTo} />}</AnimatePresence>
    </section>
  );
}
