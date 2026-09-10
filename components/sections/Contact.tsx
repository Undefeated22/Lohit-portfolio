"use client";

import { useEffect, useRef, useState } from "react";
import { identity, socials } from "@/data/portfolio";
import { Reveal, RevealLines } from "../ui/Reveal";
import { scrollToSection as go } from "../SmoothScroll";
import { sim, useSimSelector } from "@/lib/simStore";
import { commands, replayRun, openProject } from "@/lib/commands";
import { printSheet, printSheetPng } from "@/lib/print";

// SHEET 06 — EXIT 0. The run's own exit readout is the display type:
// seed, faults, minimal set, return code. Then one sentence and an address.
export default function Contact() {
  const [status, setStatus] = useState("");
  const [seed, setSeed] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const faults = useSimSelector((s) => s.faults);
  const shrunk = useSimSelector((s) => s.shrunk);
  useEffect(() => {
    setSeed(sim.seedHex);
    const un = sim.subscribe(() => setSeed(sim.seedHex));
    return () => { un(); clearTimeout(timer.current); };
  }, []);
  const flash = (s: string) => { setStatus(s); clearTimeout(timer.current); timer.current = setTimeout(() => setStatus(""), 2400); };
  const copyEmail = async () => { try { await navigator.clipboard.writeText(identity.email); flash("email copied"); } catch { flash("copy failed — use the button"); } };
  const shareRun = () => flash(String(commands.find((c) => c.id === "sim:seed")!.run()));
  const logSize = useSimSelector(() => sim.userFaults.length);

  return (
    <section id="contact" data-phase="exit" aria-label="Contact" className="relative flex min-h-svh flex-col justify-center bg-bg-deep/60 px-5 py-28 md:px-8">
      <div className="mx-auto w-full max-w-[1600px] pb-24">
        <Reveal>
          <p className="type-label mb-8 flex items-center gap-3">
            <span className="tag">EXIT 0</span> SHEET 06 / 06 — {identity.availability}
          </p>
        </Reveal>
        <h2 className="type-display text-[clamp(2.4rem,7.4vw,6.6rem)]">
          <RevealLines lines={[`RUN ${seed || "…"}`]} />
          <RevealLines lines={[`${faults} FAULTS · ${shrunk ?? faults} MINIMAL`]} className="text-text-2" delay={0.1} />
          <RevealLines lines={["EXIT 0."]} delay={0.2} />
        </h2>
        <Reveal delay={0.3}>
          <p className="type-note mt-8 max-w-[52ch]">
            That was one run of a system built to survive failure. I build those for a living — let&apos;s build one for you.
          </p>
        </Reveal>

        {/* the visit is a run: logged, replayable, printable, shareable */}
        <Reveal delay={0.35}>
          <div className="rule mt-10 grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center md:p-6">
            <div>
              <span className="type-label text-text">THIS VISIT IS A RUN</span>
              <p className="mt-2 max-w-[56ch] text-sm text-text-2">
                {logSize === 0
                  ? "You have not killed anything yet. Everything you do is appended to the URL as an event log — anyone with the link sees the same run, kills included, and can replay it from tick 0."
                  : `${logSize} event${logSize === 1 ? "" : "s"} logged in the URL. Replay them from tick 0, print the drawing as it stands, or send the link — the receiver sees exactly what you did.`}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => flash(replayRun())} className="btn">REPLAY ↺</button>
              <button onClick={() => flash(printSheet())} className="btn">PRINT SVG</button>
              <button onClick={() => printSheetPng().then(flash)} className="btn">PRINT PNG</button>
            </div>
          </div>
        </Reveal>

        <div className="mt-12 flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <a href={`mailto:${identity.email}`} className="btn btn-primary">{identity.email} ↗</a>
            <button onClick={copyEmail} className="btn" aria-label="Copy email address">COPY</button>
            <button onClick={shareRun} className="btn">SHARE THIS RUN</button>
            <span role="status" className="type-label min-h-[1rem] w-full text-text md:w-auto">{status}</span>
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
          <span className="type-label flex flex-wrap items-center gap-x-5 gap-y-1">
            <span>© 2026 {identity.name} · {identity.location.toUpperCase()}</span>
            <button onClick={() => openProject("this-drawing")} className="link text-text">HOW THIS DRAWING WORKS — SHEET 00 →</button>
          </span>
          <button onClick={() => go("#top")} className="type-label link text-text">BACK TO SHEET 01 ↑</button>
        </div>
      </footer>
    </section>
  );
}
