"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { identity } from "@/data/portfolio";
import { EASE, useReducedMotionSafe } from "@/lib/motion";

// A 1.4s boot moment, once per session: the system announces itself,
// then the shutter lifts to reveal the core already breathing.
export default function Boot() {
  const [show, setShow] = useState(false);
  const reduced = useReducedMotionSafe();

  useEffect(() => {
    if (sessionStorage.getItem("booted")) return;
    sessionStorage.setItem("booted", "1");
    setShow(true);
    const t = setTimeout(() => setShow(false), 1400);
    return () => clearTimeout(t);
  }, []);

  if (reduced) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[95] flex items-end bg-bg px-5 pb-10 md:px-10"
          exit={{ y: "-100%" }}
          transition={{ duration: 0.8, ease: EASE }}
          aria-hidden
        >
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-dim">
            {[
              `${identity.name.toLowerCase()}.sys`,
              "initializing core …",
              "SYSTEM ONLINE",
            ].map((line, i) => (
              <motion.p
                key={line}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 + i * 0.28, duration: 0.05 }}
                className={i === 2 ? "text-ember" : undefined}
              >
                {line}
              </motion.p>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
