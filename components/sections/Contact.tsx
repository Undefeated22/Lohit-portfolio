"use client";

import { useEffect, useRef, useState } from "react";
import { identity, socials } from "@/data/portfolio";
import { Reveal, RevealLines } from "../ui/Reveal";
import { scrollToSection as go } from "../SmoothScroll";
import { sim } from "@/lib/simStore";

// SHEET 06 — EXIT 0. The cluster drains behind this sheet; one node stays
// lit. The run ends with a return code and an address.
export default function Contact() {
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");
  const [seed, setSeed] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    setSeed(sim.seedHex);
    const un = sim.subscribe(() => setSeed(sim.seedHex));
    return () => { un(); clearTimeout(timer.current); };
  }, []);
  const flash = (s: "copied" | "failed") => { setCopy(s); clearTimeout(timer.current); timer.current = setTimeout(() => setCopy("idle"), 2200); };
  const copyEmail = async () => { try { await navigator.clipboard.writeText(identity.email); flash("copied"); } catch { flash("failed"); } };

  return (
    <section id="contact" data-phase="exit" aria-label="Contact" className="relative flex min-h-svh flex-col justify-center bg-bg-deep/60 px-5 py-28 md:px-8">
      <div className="mx-auto w-full max-w-[1600px] pb-24">
        <Reveal>
          <p className="type-label mb-8 flex items-center gap-3">
            <span className="stamp">EXIT 0</span> SHEET 06 / 06 — {identity.availability}
          </p>
        </Reveal>
        <h2 className="type-display text-[clamp(2.75rem,8.4vw,7.5rem)]">
          <RevealLines lines={["LET'S BUILD"]} />
          <RevealLines lines={["SYSTEMS"]} className="text-text-2" delay={0.1} />
          <RevealLines lines={["THAT SURVIVE."]} delay={0.2} />
        </h2>

        <div className="mt-14 flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <a href={`mailto:${identity.email}`} className="btn btn-stamp">{identity.email} ↗</a>
            <button onClick={copyEmail} className={`btn ${copy === "copied" ? "border-accent text-accent" : ""}`} aria-label="Copy email address">
              <span role="status">{copy === "copied" ? "COPIED ✓" : copy === "failed" ? "COPY FAILED — USE EMAIL" : "COPY"}</span>
            </button>
          </div>
          <nav aria-label="Social links" className="flex flex-wrap gap-x-8 gap-y-3">
            {socials.map((s) => (
              <a key={s.label} href={s.href} target={s.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="type-label link hover:text-text">
                {s.label} ↗
              </a>
            ))}
          </nav>
        </div>
      </div>

      <footer className="absolute inset-x-0 bottom-0 px-5 py-6 md:px-8">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <span className="type-label">© 2026 {identity.name} — RUN {seed} · <a className="link" href={`#seed=${seed}`}>SHARE THIS RUN</a></span>
          <span className="flex items-center gap-6">
            <span className="type-label">NEXT.JS / R3F / GLSL · DETERMINISTIC</span>
            <button onClick={() => go("#top")} className="type-label link text-text">BACK TO SHEET 01 ↑</button>
          </span>
        </div>
      </footer>
    </section>
  );
}
