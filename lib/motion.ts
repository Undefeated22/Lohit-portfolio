"use client";

import { useEffect, useState } from "react";

// The one easing family, imported everywhere — no per-file copies.
export const EASE = [0.16, 1, 0.3, 1] as const;

// SSR-safe reduced-motion: server and first client render agree (false),
// then the real preference applies post-mount. Avoids the hydration
// mismatch framer's useReducedMotion (null on SSR) causes in structural
// branches like Work's pinned-vs-list layout.
export function useReducedMotionSafe() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

// Character-decode reveal: each glyph cycles through drafting characters
// before settling — CLI flavour without a fake terminal. Disabled under
// reduced motion (returns the final text immediately).
export function useDecode(text: string, active: boolean, stagger = 28) {
  const [out, setOut] = useState(text);
  const reduced = useReducedMotionSafe();
  useEffect(() => {
    if (!active || reduced) { setOut(text); return; }
    const pool = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/=+-";
    const start = performance.now();
    let raf = 0;
    const step = () => {
      const t = performance.now() - start;
      let done = true;
      const s = [...text].map((ch, i) => {
        if (ch === " " || ch === "\n") return ch;
        const settle = i * stagger + 160;
        if (t >= settle) return ch;
        done = false;
        return pool[(Math.floor(t / 40) + i * 7) % pool.length];
      }).join("");
      setOut(s);
      if (!done) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [text, active, reduced, stagger]);
  return out;
}
