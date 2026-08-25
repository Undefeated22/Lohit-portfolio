"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { world } from "@/lib/state";
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
  el.focus({ preventScroll: true });
}

export default function SmoothScroll() {
  const reduced = useReducedMotionSafe();

  useEffect(() => {
    const updateNative = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      world.scroll = max > 0 ? window.scrollY / max : 0;
    };

    if (reduced) {
      window.addEventListener("scroll", updateNative, { passive: true });
      updateNative();
      return () => window.removeEventListener("scroll", updateNative);
    }

    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
    lenisRef = lenis;
    lenis.on("scroll", (e: { progress: number }) => {
      world.scroll = e.progress;
    });
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
    };
  }, [reduced]);

  return null;
}
