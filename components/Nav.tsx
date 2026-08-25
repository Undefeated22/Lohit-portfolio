"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { identity } from "@/data/portfolio";
import Magnetic from "./ui/Magnetic";
import { lenisRef, scrollToSection as go } from "./SmoothScroll";
import { EASE } from "@/lib/motion";

const LINKS = [
  { label: "WORK", href: "#work" },
  { label: "ABOUT", href: "#about" },
  { label: "LAB", href: "#lab" },
  { label: "CONTACT", href: "#contact" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState("");
  const menuBtn = useRef<HTMLButtonElement>(null);

  // local time at the operator's location — client-only, so no hydration skew
  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("en-GB", {
          timeZone: "Asia/Kolkata",
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });
  const [section, setSection] = useState("top");

  useEffect(() => {
    const obs = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setSection(e.target.id)),
      { rootMargin: "-45% 0px -45% 0px" }
    );
    ["top", "work", "about", "lab", "contact"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    lenisRef?.stop();
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return setOpen(false);
      if (e.key !== "Tab" || !menuRef.current) return;
      // contain Tab inside the full-screen menu
      const nodes = menuRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!menuRef.current.contains(document.activeElement)) {
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
      menuBtn.current?.focus();
    };
  }, [open]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-500 ${
        scrolled ? "glass border-b border-line" : ""
      }`}
    >
      {/* reading position, drawn as a hairline of ember across the top edge */}
      <motion.div
        className="absolute inset-x-0 top-0 h-px origin-left bg-ember"
        style={{ scaleX: progress }}
        aria-hidden
      />
      <nav
        aria-label="Primary"
        className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-5 md:px-10"
      >
        <a
          href="#top"
          onClick={(e) => { e.preventDefault(); go("#top"); }}
          className="type-display text-[17px] tracking-tight text-fg"
          aria-label={`${identity.name} — home`}
        >
          {identity.name}
          <span className="text-ember">.</span>
        </a>

        {/* desktop */}
        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <Magnetic key={l.label} strength={0.25}>
              <a
                href={l.href}
                onClick={(e) => { e.preventDefault(); go(l.href); }}
                aria-current={section === l.href.slice(1) || undefined}
                className={`type-label link-line relative transition-colors duration-300 hover:text-fg ${
                  section === l.href.slice(1) ? "text-fg" : "text-fg-dim"
                }`}
              >
                {l.label}
                {section === l.href.slice(1) && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute -bottom-1.5 left-0 h-px w-full bg-ember"
                    transition={{ duration: 0.4, ease: EASE }}
                  />
                )}
              </a>
            </Magnetic>
          ))}
          <a
            href={identity.resumeUrl}
            target="_blank"
            rel="noreferrer"
            className="type-label link-line text-fg-dim transition-colors duration-300 hover:text-fg"
          >
            RESUME ↗
          </a>
          <span className="flex items-center gap-2 type-label text-fg-dim">
            <span className="size-1.5 rounded-full bg-ok pulse-dot" />
            {identity.availability}
            {time && <span className="type-index text-fg-faint">/ {time} IST</span>}
          </span>
        </div>

        {/* mobile trigger */}
        <button
          ref={menuBtn}
          className="type-label text-fg md:hidden"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          MENU
        </button>
      </nav>

      {/* full-screen typographic menu on mobile */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            ref={menuRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed inset-0 z-50 flex flex-col justify-between gap-6 overflow-y-auto bg-bg px-6 pb-10 pt-5 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="flex items-center justify-between">
              <span className="type-display text-[17px]">
                {identity.name}
                <span className="text-ember">.</span>
              </span>
              <button className="type-label text-fg" onClick={() => setOpen(false)} autoFocus>
                CLOSE
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {LINKS.map((l, i) => (
                <span key={l.label} className="block overflow-hidden">
                  <motion.a
                    href={l.href}
                    className="type-display block text-[min(13vw,4.5rem)] leading-none text-fg"
                    initial={{ y: "110%" }}
                    animate={{ y: "0%" }}
                    exit={{ y: "110%" }}
                    transition={{ duration: 0.7, delay: 0.05 + i * 0.06, ease: EASE }}
                    onClick={(e) => {
                      e.preventDefault();
                      setOpen(false);
                      // navigate after the close cleanup restarts lenis —
                      // scrollTo is a no-op while lenis is stopped
                      setTimeout(() => go(l.href), 80);
                    }}
                  >
                    {l.label}
                  </motion.a>
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="flex items-center gap-2 type-label">
                <span className="size-1.5 rounded-full bg-ok pulse-dot" />
                {identity.availability}
              </span>
              <a href={`mailto:${identity.email}`} className="type-label text-ember">
                {identity.email}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
