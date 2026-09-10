"use client";

import { useEffect, useRef, useState } from "react";
import { identity, projects, stack, socials, colophon } from "@/data/portfolio";
import { commands, openProject, replayRun } from "@/lib/commands";
import { printSheet, printSheetPng } from "@/lib/print";
import { setSound, soundOn } from "@/lib/audio";
import { sim } from "@/lib/simStore";
import { fetchFeed, ago } from "@/lib/github";
import { lenisRef, scrollToSection } from "./SmoothScroll";
import { shortcutsEnabled, typingTarget } from "@/lib/shortcuts";

// A line editor, not a VT emulator: the same command registry as the
// palette, plus a few shell-flavoured aliases. Output is real HTML.
type Line = { prompt?: string; out: string; kind?: "err" | "ok" };

const HELP = `commands: help ls cat <slug> open <slug> whoami stack contact gh
          kill shrink replay play sound [on|off] print [png] seed [hex] reseed goto <section> clear exit`;

export default function Terminal() {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>([{ out: `lohit.sys — type 'help'. run ${sim.seedHex}` }]);
  const [value, setValue] = useState("");
  const history = useRef<string[]>([]);
  const hIdx = useRef(-1);
  const input = useRef<HTMLInputElement>(null);
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && shortcutsEnabled() && !typingTarget(e) && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setOpen(true);
      }
    };
    const onEmit = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("lohit:terminal", onEmit);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("lohit:terminal", onEmit);
    };
  }, []);

  const opener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (open) {
      opener.current = document.activeElement as HTMLElement | null;
      requestAnimationFrame(() => input.current?.focus());
      lenisRef?.stop();
    } else {
      lenisRef?.start();
      opener.current?.focus?.();
      opener.current = null;
    }
  }, [open]);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [lines]);

  const print = (out: string, kind?: Line["kind"]) => setLines((l) => [...l, { out, kind }]);

  const exec = async (raw: string) => {
    const [cmd, ...args] = raw.trim().split(/\s+/);
    const arg = args.join(" ");
    setLines((l) => [...l, { prompt: raw, out: "" }]);
    if (!cmd) return;
    history.current.push(raw);
    hIdx.current = -1;
    const slugOf = (s: string) => [...projects, colophon].find((p) => p.slug === s || p.slug.startsWith(s) || p.name.toLowerCase() === s.toLowerCase());
    switch (cmd) {
      case "help": return print(HELP);
      case "ls": return print([colophon, ...projects].map((p) => `${p.index}  ${p.slug.padEnd(16)} ${p.tagline}`).join("\n"));
      case "cat": {
        const p = slugOf(arg);
        if (!p) return print(`cat: ${arg}: no such project`, "err");
        return print(`${p.name} — ${p.tagline}\n\n${p.overview}\n\nstack: ${p.tech.join(", ")}${p.live ? `\nlive:  ${p.live}` : ""}${p.github ? `\nrepo:  ${p.github}` : ""}`);
      }
      case "open": {
        const p = slugOf(arg);
        if (!p) return print(`open: ${arg}: no such project`, "err");
        setOpen(false);
        return openProject(p.slug);
      }
      case "whoami": return print(`${identity.legalName} — backend engineer\n${identity.location}\n${identity.statement.replace(/\n/g, " ")}`);
      case "stack": return print(stack.map((g) => `${g.group.padEnd(11)} ${g.items.join(" · ")}`).join("\n"));
      case "contact": return print(`${identity.email}\n${socials.map((s) => `${s.label.toLowerCase().padEnd(9)} ${s.href}`).join("\n")}`);
      case "gh": {
        print("fetching recent public events …");
        try {
          const ev = await fetchFeed(8);
          return print(ev.length ? ev.map((e) => `${ago(e.at).padStart(3)}  ${e.repo.padEnd(28)} ${e.detail}`).join("\n") : "no recent public events (or rate-limited)");
        } catch { return print("github unreachable", "err"); }
      }
      case "kill": return print(String(commands.find((c) => c.id === "sim:kill")!.run()), "ok");
      case "shrink": return print(String(commands.find((c) => c.id === "sim:shrink")!.run()), "ok");
      case "seed": {
        if (!arg) return print(`seed ${sim.seedHex} — share ${location.origin}/#seed=${sim.seedHex}`);
        const n = Number(arg);
        if (!Number.isFinite(n)) return print(`seed: '${arg}' is not a number`, "err");
        sim.setSeed(n);
        return print(`run reseeded → ${sim.seedHex}`, "ok");
      }
      case "reseed": return print(String(commands.find((c) => c.id === "sim:reseed")!.run()), "ok");
      case "replay": { setOpen(false); const msg = replayRun(); window.dispatchEvent(new CustomEvent("lohit:notice", { detail: msg })); return; }
      case "sound": { const next = arg === "on" ? true : arg === "off" ? false : !soundOn(); void setSound(next); return print(`sound ${next ? "on — every event has a note" : "off"}`, "ok"); }
      case "play": { void setSound(true); setOpen(false); const msg = replayRun(); window.dispatchEvent(new CustomEvent("lohit:notice", { detail: msg })); return; }
      case "print": {
        if (arg === "png") { printSheetPng().then((m) => print(m, "ok")); return; }
        return print(printSheet(), "ok");
      }
      case "goto": {
        const id = arg.replace(/^#/, "");
        lenisRef?.start(); // lenis.scrollTo is a no-op while stopped
        setOpen(false);
        scrollToSection(`#${id === "home" ? "top" : id}`);
        return;
      }
      case "clear": return setLines([]);
      case "exit": return setOpen(false);
      default: return print(`${cmd}: command not found — try 'help'`, "err");
    }
  };

  const complete = () => {
    const [cmd, arg = ""] = value.split(/\s+/);
    const pool = arg !== "" || value.endsWith(" ")
      ? projects.map((p) => p.slug).filter((s) => s.startsWith(arg))
      : HELP.split(/\s+/).filter((w) => /^[a-z]+$/.test(w) && w.startsWith(cmd));
    if (pool.length === 1) setValue(arg !== "" || value.endsWith(" ") ? `${cmd} ${pool[0]} ` : `${pool[0]} `);
    else if (pool.length > 1) print(pool.join("  "));
  };

  if (!open) return null;
  return (
    <section
      data-ui
      data-lenis-prevent
      aria-labelledby="term-h"
      className="fixed inset-x-0 bottom-0 z-[80] flex h-[42vh] flex-col border-t border-text bg-bg-deep/95 backdrop-blur-md"
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <h2 id="term-h" className="type-label text-text">terminal — lohit.sys</h2>
        <button onClick={() => setOpen(false)} className="type-label link text-text">close (esc)</button>
      </div>
      <div ref={log} role="log" aria-live="polite" tabIndex={0} className="flex-1 overflow-y-auto px-4 py-3 font-mono text-[13px] leading-relaxed">
        {lines.map((l, i) => (
          <div key={i}>
            {l.prompt !== undefined && <div className="text-label"><span className="text-label">$ </span>{l.prompt}</div>}
            {l.out && <pre className={`whitespace-pre-wrap ${l.kind === "err" ? "text-accent" : l.kind === "ok" ? "text-text" : "text-text-2"}`}>{l.out}</pre>}
          </div>
        ))}
      </div>
      <form
        className="flex items-center gap-2 border-t border-line px-4 py-2"
        onSubmit={(e) => { e.preventDefault(); const v = value; setValue(""); exec(v); }}
      >
        <label htmlFor="cmd" className="sr-only">Command</label>
        <span className="text-label">$</span>
        <input
          ref={input}
          id="cmd"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            else if (e.key === "Tab" && !e.shiftKey && value) { e.preventDefault(); complete(); }
            else if (e.key === "ArrowUp") { e.preventDefault(); const h = history.current; if (!h.length) return; hIdx.current = hIdx.current < 0 ? h.length - 1 : Math.max(0, hIdx.current - 1); setValue(h[hIdx.current]); }
            else if (e.key === "ArrowDown") { e.preventDefault(); const h = history.current; if (hIdx.current < 0) return; hIdx.current = Math.min(h.length, hIdx.current + 1); setValue(h[hIdx.current] ?? ""); }
            else if (e.key === "l" && e.ctrlKey) { e.preventDefault(); setLines([]); }
          }}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="go"
          className="w-full bg-transparent font-mono text-[13px] text-text outline-none"
        />
      </form>
    </section>
  );
}
