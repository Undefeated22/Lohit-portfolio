"use client";

import { identity, projects, socials } from "@/data/portfolio";
import { scrollToSection } from "@/components/SmoothScroll";
import { sim } from "./simStore";
import { shortcutsEnabled, setShortcutsEnabled } from "./shortcuts";

// One registry, three surfaces: ⌘K palette, terminal, keyboard shortcuts.
export type Command = {
  id: string;
  label: string;
  group: "Go to" | "Projects" | "Simulator" | "Actions" | "Links";
  keywords?: string[];
  shortcut?: string;
  run: () => string | void; // optional one-line result for the terminal
};

export function openProject(slug: string) {
  if (location.hash !== `#project/${slug}`) history.pushState({ fromSite: true }, "", `#project/${slug}`);
  dispatchEvent(new PopStateEvent("popstate"));
}

export function closeProject() {
  if (location.hash.startsWith("#project/")) history.back();
}

export const emit = (name: string, detail?: unknown) =>
  dispatchEvent(new CustomEvent(name, { detail }));

const go = (id: string, label: string, keywords: string[] = []): Command => ({
  id: `go:${id}`,
  label,
  group: "Go to",
  keywords,
  run: () => { scrollToSection(`#${id}`); },
});

export const commands: Command[] = [
  go("top", "Boot / identity", ["home", "hero", "start"]),
  go("about", "About — lease acquire", ["who", "bio"]),
  go("work", "Work — workflows", ["projects", "case studies"]),
  go("lab", "Lab — fault injection", ["experiments", "chaos"]),
  go("journey", "Journey — shrink", ["experience", "timeline", "education"]),
  go("contact", "Contact — exit 0", ["email", "hire"]),

  ...projects.map<Command>((p) => ({
    id: `open:${p.slug}`,
    label: `Open ${p.name} case study`,
    group: "Projects",
    keywords: [p.slug, ...p.tech.map((t) => t.toLowerCase())],
    run: () => { openProject(p.slug); },
  })),

  {
    id: "sim:kill",
    label: "kill -9 a live node",
    group: "Simulator",
    keywords: ["crash", "sigkill", "fault", "chaos"],
    shortcut: "K",
    run: () => {
      const t = sim.killAny();
      return t < 0 ? "no live node to kill" : `SIGKILL node ${t} at tick ${sim.tick}`;
    },
  },
  {
    id: "sim:shrink",
    label: "shrink injected faults (ddmin)",
    group: "Simulator",
    keywords: ["delta debugging", "minimize", "bisect"],
    shortcut: "S",
    run: () => {
      const r = sim.shrink();
      return r.from === 0
        ? "no faults injected yet — kill something first"
        : `shrunk ${r.from} → ${r.to} fault${r.to === 1 ? "" : "s"} in ${r.steps} runs${r.to ? ` (nodes ${r.tiles.join(", ")})` : " — cluster never lost a shard"}`;
    },
  },
  {
    id: "sim:reseed",
    label: "reseed the run",
    group: "Simulator",
    keywords: ["random", "seed", "new run"],
    run: () => `seed ${sim.seedHex} → ${(sim.randomSeed(), sim.seedHex)} — URL updated, share it to reproduce`,
  },
  {
    id: "sim:seed",
    label: "copy this run's seed URL",
    group: "Simulator",
    keywords: ["share", "reproduce", "url"],
    run: () => {
      const url = `${location.origin}${location.pathname}#seed=${sim.seedHex}`;
      navigator.clipboard?.writeText(url).catch(() => {});
      return `seed URL: ${url}`;
    },
  },

  {
    id: "act:shortcuts",
    label: "Toggle single-key shortcuts (K / S / /)",
    group: "Actions",
    keywords: ["keyboard", "accessibility", "disable"],
    run: () => {
      const next = !shortcutsEnabled();
      setShortcutsEnabled(next);
      return `single-key shortcuts ${next ? "on" : "off"} — ⌘K always works`;
    },
  },
  {
    id: "act:terminal",
    label: "Open terminal",
    group: "Actions",
    keywords: ["shell", "cli", "console"],
    shortcut: "/",
    run: () => { emit("lohit:terminal"); },
  },
  {
    id: "act:email",
    label: "Copy email address",
    group: "Actions",
    keywords: ["mail", "contact"],
    run: () => {
      navigator.clipboard?.writeText(identity.email).catch(() => {});
      return identity.email;
    },
  },
  {
    id: "act:resume",
    label: "Open resume (PDF)",
    group: "Actions",
    keywords: ["cv", "pdf"],
    run: () => { window.open(identity.resumeUrl, "_blank", "noopener"); },
  },

  ...socials
    .filter((s) => s.href.startsWith("http"))
    .map<Command>((s) => ({
      id: `link:${s.label.toLowerCase()}`,
      label: `${s.label} ↗`,
      group: "Links",
      run: () => { window.open(s.href, "_blank", "noopener"); },
    })),
  ...projects
    .filter((p) => p.live)
    .map<Command>((p) => ({
      id: `link:live:${p.slug}`,
      label: `${p.name} — live demo ↗`,
      group: "Links",
      keywords: ["demo", "site"],
      run: () => { window.open(p.live!, "_blank", "noopener"); },
    })),
];

// tiny subsequence scorer: exact/prefix beats scattered matches
export function score(cmd: Command, q: string): number {
  if (!q) return 1;
  const hay = `${cmd.label} ${cmd.keywords?.join(" ") ?? ""} ${cmd.group}`.toLowerCase();
  const needle = q.toLowerCase().trim();
  if (hay.includes(needle)) return 3 + (cmd.label.toLowerCase().startsWith(needle) ? 2 : 0);
  let i = 0;
  for (const ch of hay) if (ch === needle[i]) i++;
  return i === needle.length ? 1 : 0;
}

export function search(q: string, limit = 12): Command[] {
  return commands
    .map((c) => ({ c, s: score(c, q) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.c);
}
