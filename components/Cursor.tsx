"use client";

import { useEffect, useRef, useState } from "react";
import { world } from "@/lib/state";

// Custom cursor: ember dot + trailing ring. The ring reads intent —
// it grows on links, shows a verb on project panels ([data-cursor="VIEW"]).
// Fine pointers only; touch devices never mount it.
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [label, setLabel] = useState("");
  const [mode, setMode] = useState<"idle" | "link" | "verb">("idle");

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;
    setEnabled(true);
    document.documentElement.classList.add("cursor-none-app");

    let x = innerWidth / 2, y = innerHeight / 2;
    let rx = x, ry = y;
    let px = x, py = y, pt = performance.now();

    const move = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      const now = performance.now();
      const v = Math.hypot(x - px, y - py) / Math.max(1, now - pt);
      world.cursorEnergy = Math.min(1, world.cursorEnergy + v * 0.06);
      world.pointerX = (x / innerWidth) * 2 - 1;
      world.pointerY = -((y / innerHeight) * 2 - 1);
      px = x; py = y; pt = now;

      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-cursor], a, button");
      const verb = el?.dataset.cursor;
      if (verb) {
        setMode("verb");
        setLabel(verb);
      } else if (el) {
        setMode("link");
        setLabel("");
      } else {
        setMode("idle");
        setLabel("");
      }
    };

    let raf = 0;
    const loop = () => {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      if (dot.current) dot.current.style.transform = `translate(${x}px, ${y}px)`;
      if (ring.current) ring.current.style.transform = `translate(${rx}px, ${ry}px)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener("mousemove", move, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", move);
      document.documentElement.classList.remove("cursor-none-app");
    };
  }, []);

  if (!enabled) return null;

  const ringSize = mode === "verb" ? 72 : mode === "link" ? 44 : 28;

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none" aria-hidden>
      <div
        ref={dot}
        className="absolute -top-[3px] -left-[3px] size-1.5 rounded-full bg-ember"
        style={{ opacity: mode === "verb" ? 0 : 1 }}
      />
      <div
        ref={ring}
        className="absolute top-0 left-0 flex items-center justify-center"
      >
        <div
          className="flex items-center justify-center rounded-full border border-fg/30 -translate-x-1/2 -translate-y-1/2 transition-[width,height,background-color] duration-300"
          style={{
            width: ringSize,
            height: ringSize,
            backgroundColor: mode === "verb" ? "rgba(255,92,31,0.92)" : "transparent",
            borderColor: mode === "verb" ? "transparent" : undefined,
            transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {label && (
            <span className="font-mono text-[10px] tracking-[0.14em] text-bg font-medium">
              {label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
