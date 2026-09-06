"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { identity } from "@/data/portfolio";
import { lenisRef, scrollToSection as go } from "./SmoothScroll";
import { emit } from "@/lib/commands";
import { sim } from "@/lib/simStore";
import { EASE } from "@/lib/motion";

const LINKS = [
  { label: "ABOUT", href: "#about" },
  { label: "WORK", href: "#work" },
  { label: "LAB", href: "#lab" },
  { label: "JOURNEY", href: "#journey" },
  { label: "CONTACT", href: "#contact" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState("");
  const [section, setSection] = useState("top");
  const [seed, setSeed] = useState("");
  const menuBtn = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    const tick = () =>
      setTime(new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour12: false, hour: "2-digit", minute: "2-digit" }));
    tick();
    const id = setInterval(tick, 15_000);
    setSeed(sim.seedHex);
    const unsub = sim.subscribe(() => setSeed(sim.seedHex));
    const obs = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setSection(e.target.id)),
      { rootMargin: "-45% 0px -45% 0px" }
    );
    ["top", "about", "work", "lab", "journey", "contact"].forEach((i) => {
      const el = document.getElementById(i);
      if (el) obs.observe(el);
    });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearInterval(id);
      unsub();
      obs.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    lenisRef?.stop();
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return setOpen(false);
      if (e.key !== "Tab" || !menuRef.current) return;
      const nodes = menuRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
      if (!nodes.length) return;
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (!menuRef.current.contains(document.activeElement)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); return; }
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      lenisRef?.start();
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      menuBtn.current?.focus();
    };
  }, [open]);

  return (
    <header
      data-ui
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-500 ${
        scrolled ? "border-line bg-bg/85 backdrop-blur-md" : "border-transparent"
      }`}
    >
      <nav aria-label="Primary" className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-5 md:px-8">
        <a
          href="#top"
          onClick={(e) => { e.preventDefault(); go("#top"); }}
          className="flex items-baseline gap-3"
          aria-label={`${identity.name} — home`}
        >
          <span className="type-display text-[15px] tracking-tight">{identity.name}</span>
          <span className="type-label hidden sm:inline">run {seed}</span>
        </a>

        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => {
            const active = section === l.href.slice(1);
            return (
              <a
                key={l.label}
                href={l.href}
                onClick={(e) => { e.preventDefault(); go(l.href); }}
                aria-current={active || undefined}
                className={`type-label relative transition-colors duration-300 hover:text-text ${active ? "text-text" : ""}`}
              >
                {l.label}
                {active && (
                  <motion.span layoutId="nav-active" className="absolute -bottom-1.5 left-0 h-px w-full bg-accent" transition={{ duration: 0.4, ease: EASE }} />
                )}
              </a>
            );
          })}
          <a href={identity.resumeUrl} target="_blank" rel="noreferrer" className="type-label link hover:text-text">
            RESUME ↗
          </a>
          <button
            onClick={() => emit("lohit:palette")}
            className="type-label rule flex items-center gap-2 px-2.5 py-1.5 text-text transition-colors hover:border-text"
            aria-label="Open command palette"
          >
            <kbd className="font-mono">⌘K</kbd>
          </button>
          <span className="type-label flex items-center gap-2">
            <span className="size-1.5 bg-accent pulse-dot" />
            {identity.availability}
            {time && <span className="text-label">/ {time} IST</span>}
          </span>
        </div>

        <div className="flex items-center gap-3 md:hidden">
          <button onClick={() => emit("lohit:palette")} className="type-label rule px-2.5 py-1.5 text-text" aria-label="Open command palette">
            ⌘K
          </button>
          <button ref={menuBtn} className="type-label text-text" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="mobile-menu">
            MENU
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            ref={menuRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="grid-bg fixed inset-0 z-50 flex flex-col justify-between gap-6 overflow-y-auto bg-bg px-6 pb-10 pt-4 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <span className="type-display text-[15px]">{identity.name}</span>
              <button className="type-label text-text" onClick={() => setOpen(false)} autoFocus>CLOSE</button>
            </div>
            <div className="flex flex-col gap-1">
              {LINKS.map((l, i) => (
                <span key={l.label} className="block overflow-hidden border-b border-line">
                  <motion.a
                    href={l.href}
                    className="type-display block py-3 text-[min(12vw,4rem)] text-text"
                    initial={{ y: "110%" }}
                    animate={{ y: "0%" }}
                    exit={{ y: "110%" }}
                    transition={{ duration: 0.7, delay: 0.05 + i * 0.06, ease: EASE }}
                    onClick={(e) => { e.preventDefault(); setOpen(false); setTimeout(() => go(l.href), 80); }}
                  >
                    {l.label}
                  </motion.a>
                </span>
              ))}
              <a href={identity.resumeUrl} target="_blank" rel="noreferrer" className="type-label mt-4 text-text">RESUME ↗</a>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="type-label flex items-center gap-2"><span className="size-1.5 bg-accent pulse-dot" />{identity.availability}</span>
              <a href={`mailto:${identity.email}`} className="type-label text-accent">{identity.email}</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
