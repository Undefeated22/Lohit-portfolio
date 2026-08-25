"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { EASE, useReducedMotionSafe } from "@/lib/motion";

// The one reveal used site-wide: rise + de-blur on scroll into view.
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduced = useReducedMotionSafe();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

// Display lines that rise out of a clip mask, staggered per line.
// The in-view observer lives on the UNCLIPPED wrapper: the lines start fully
// outside their overflow-hidden masks, so observing them directly would never
// report an intersection and the reveal would deadlock.
export function RevealLines({
  lines,
  className,
  delay = 0,
}: {
  lines: ReactNode[];
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotionSafe();
  return (
    <motion.span
      className="block"
      initial={reduced ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, margin: "-8% 0px" }}
    >
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden">
          <motion.span
            className={`block ${className ?? ""}`}
            variants={{
              hidden: { y: "110%" },
              visible: {
                y: "0%",
                transition: { duration: 1, delay: delay + i * 0.09, ease: EASE },
              },
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}
