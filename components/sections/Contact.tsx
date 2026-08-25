"use client";

import { useEffect, useRef, useState } from "react";
import { identity, socials } from "@/data/portfolio";
import { Reveal, RevealLines } from "../ui/Reveal";
import Magnetic from "../ui/Magnetic";
import { scrollToSection as go } from "../SmoothScroll";

// The finale. The core contracts to an ignition point behind these words.
export default function Contact() {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const flash = (state: "copied" | "failed") => {
    setCopyState(state);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopyState("idle"), 2200);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(identity.email);
      flash("copied");
    } catch {
      // insecure context or permission denied — tell the user, mailto remains
      flash("failed");
    }
  };

  return (
    <section
      id="contact"
      aria-label="Contact"
      className="relative flex min-h-svh flex-col justify-center px-5 py-32 md:px-10"
    >
      <div className="mx-auto w-full max-w-[1600px] pb-24">
        <Reveal>
          <p className="type-label mb-8 flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-ok pulse-dot" />
            SYSTEM READY — {identity.availability}
          </p>
        </Reveal>

        <h2 className="type-display text-[clamp(3.4rem,11.5vw,11rem)] mix-blend-difference">
          <RevealLines lines={["LET'S BUILD"]} />
          <RevealLines lines={["SYSTEMS"]} className="type-outline" delay={0.1} />
          <RevealLines lines={["THAT SURVIVE."]} delay={0.2} />
        </h2>

        <div className="mt-14 flex flex-col gap-10 md:mt-20 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Magnetic strength={0.2}>
              <a
                href={`mailto:${identity.email}`}
                data-cursor="SAY HI"
                className="group inline-flex items-center gap-4 rounded-full bg-fg py-4 pl-8 pr-6 font-mono text-[13px] tracking-[0.1em] text-bg transition-colors duration-300 hover:bg-ember"
              >
                {identity.email}
                <span className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                  ↗
                </span>
              </a>
            </Magnetic>
            <button
              onClick={copy}
              className={`hairline rounded-full px-6 py-4 font-mono text-[12px] tracking-[0.12em] transition-colors duration-300 ${
                copyState === "copied"
                  ? "border-ok text-ok"
                  : copyState === "failed"
                    ? "border-ember text-ember"
                    : "hover:border-ember hover:text-ember"
              }`}
              aria-label="Copy email address"
            >
              <span role="status">
                {copyState === "copied"
                  ? "COPIED ✓"
                  : copyState === "failed"
                    ? "COPY FAILED — USE EMAIL"
                    : "COPY"}
              </span>
            </button>
          </div>

          <nav aria-label="Social links" className="flex flex-wrap gap-x-8 gap-y-3">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="type-label link-line text-fg-dim transition-colors duration-300 hover:text-fg"
              >
                {s.label} ↗
              </a>
            ))}
          </nav>
        </div>
      </div>

      <footer className="absolute bottom-0 inset-x-0 px-5 py-6 md:px-10">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2 border-t border-line pt-5">
          <span className="type-label text-fg-faint">
            © 2026 {identity.name} — {identity.location.toUpperCase()}
          </span>
          <span className="flex items-center gap-6">
            <span className="type-label text-fg-faint">NEXT.JS / R3F / GLSL</span>
            <button
              onClick={() => go("#top")}
              className="type-label link-line text-fg-dim transition-colors duration-300 hover:text-fg"
            >
              BACK TO TOP ↑
            </button>
          </span>
        </div>
      </footer>
    </section>
  );
}
