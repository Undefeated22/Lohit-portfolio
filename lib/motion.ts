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
