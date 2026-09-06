"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { sim } from "@/lib/simStore";
import { seedFromLocation } from "@/lib/sim";
import { useReducedMotionSafe } from "@/lib/motion";

export let lenisRef: Lenis | null = null;

// Shared anchor navigation: lenis glide when available, and focus moves with
// the scroll so keyboard/AT users land where the viewport does.
export function scrollToSection(href: string) {
  const el = document.querySelector<HTMLElement>(href);
  if (!el) return;
  if (lenisRef) lenisRef.scrollTo(el, { duration: 1.4 });
  else el.scrollIntoView();
  el.setAttribute("tabindex", "-1");
  // deferred: a modal <dialog> may still be closing, which would swallow focus
  requestAnimationFrame(() => el.focus({ preventScroll: true }));
}

// Scroll is the simulator's clock: every scroll event maps the read head
// to a tick, and each [data-phase] section owns one phase of the run.
export default function SmoothScroll() {
  const reduced = useReducedMotionSafe();

  useEffect(() => {
    sim.init();
    const seedTimer = setTimeout(() => sim.publishSeed(), 0);
    const onHash = () => {
      if (!/seed=/.test(location.hash)) return;
      const s = seedFromLocation();
      if (s !== sim.seed) sim.setSeed(s);
    };
    window.addEventListener("hashchange", onHash);
    const register = () => {
      const els = Array.from(document.querySelectorAll<HTMLElement>("[data-phase]"));
      sim.registerSections(els.map((el) => ({ phase: el.dataset.phase as never, el })));
      sim.onScroll(window.scrollY, window.innerHeight);
    };
    register();
    const ro = new ResizeObserver(register);
    ro.observe(document.body);
    document.fonts?.ready.then(register);

    if (reduced) {
      const onScroll = () => sim.onScroll(window.scrollY, window.innerHeight);
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("hashchange", onHash);
        ro.disconnect();
        clearTimeout(seedTimer);
      };
    }

    const lenis = new Lenis({ lerp: 0.1 });
    lenisRef = lenis;
    lenis.on("scroll", (e: { scroll: number }) => sim.onScroll(e.scroll, window.innerHeight));
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef = null;
      window.removeEventListener("hashchange", onHash);
      ro.disconnect();
      clearTimeout(seedTimer);
    };
  }, [reduced]);

  return null;
}
