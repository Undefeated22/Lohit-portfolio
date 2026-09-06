"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { sim } from "@/lib/simStore";
import { EASE, useReducedMotionSafe } from "@/lib/motion";

// A 1.6s boot, once per session: the run announces its seed, the shutter
// lifts on a cluster already powering up.
export default function Boot() {
  const [show, setShow] = useState(false);
  const [seed, setSeed] = useState("");
  const reduced = useReducedMotionSafe();

  useEffect(() => {
    if (sessionStorage.getItem("booted") || document.hidden) return;
    sessionStorage.setItem("booted", "1");
    setSeed(sim.seedHex);
    setShow(true);
    const t = setTimeout(() => setShow(false), 1600);
    return () => clearTimeout(t);
  }, []);

  if (reduced) return null;
  const lines = [`$ dexctl up --seed ${seed}`, "booting 36 nodes …", "leases acquired · fencing tokens = 1", "RUN STARTED"];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="grid-bg fixed inset-0 z-[95] flex items-end bg-bg px-5 pb-10 md:px-8"
          exit={{ y: "-100%" }}
          transition={{ duration: 0.8, ease: EASE }}
          aria-hidden
        >
          <div className="type-label text-label">
            {lines.map((line, i) => (
              <motion.p
                key={line}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 + i * 0.28, duration: 0.05 }}
                className={i === lines.length - 1 ? "text-accent" : i === 0 ? "text-text" : undefined}
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
