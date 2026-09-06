"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";
import {
  makeRun,
  snapshot,
  shrink as ddmin,
  seedFromLocation,
  seedHex,
  phaseStart,
  PHASE_TICKS,
  TOTAL_TICKS,
  N,
  type Fault,
  type Phase,
  type Run,
  type Snapshot,
} from "./sim";
import { projects } from "@/data/portfolio";

// Runtime glue around the pure simulator. Scroll drives the tick; the
// renderer reads `sim.snapshot` every frame; React surfaces subscribe.
const hues = projects.map((p) => p.hue);

let seed = 0;
let run: Run | null = null;
let tick = 0;
let userFaults: Fault[] = [];
let shrunk: { from: number; to: number; steps: number; tiles: number[] } | null = null;
let snap: Snapshot | null = null;
let version = 0;
const listeners = new Set<() => void>();

// section → phase mapping, measured from the DOM by the page
let sections: { phase: Phase; top: number; height: number }[] = [];

function ensure() {
  if (run) return;
  seed = seedFromLocation();
  run = makeRun(seed, hues);
  recompute();
}

/** Write the run's seed into the URL so a shared link reproduces it. Called
    after mount — Next's router rewrites the URL during hydration. */
function publishSeed() {
  ensure();
  if (/seed=/.test(location.hash) || location.hash.startsWith("#project/")) return;
  history.replaceState(history.state, "", `#seed=${seedHex(seed)}`);
}

function recompute() {
  if (!run) return;
  snap = snapshot(run, tick, userFaults, shrunk?.to ?? null);
  version++;
  listeners.forEach((l) => l());
}

function setTick(t: number) {
  t = Math.max(0, Math.min(TOTAL_TICKS, Math.round(t)));
  if (t === tick) return;
  tick = t;
  recompute();
}

export const sim = {
  init: ensure,
  publishSeed,
  get seed() { ensure(); return seed; },
  get seedHex() { ensure(); return seedHex(seed); },
  get tick() { return tick; },
  get snapshot(): Snapshot { ensure(); return snap!; },
  get run(): Run { ensure(); return run!; },
  get shrunk() { return shrunk; },
  get userFaults() { return userFaults; },
  get version() { return version; },

  setTick,

  /** The page registers which DOM section plays which phase. */
  registerSections(list: { phase: Phase; el: HTMLElement }[]) {
    sections = list.map(({ phase, el }) => {
      const r = el.getBoundingClientRect();
      return { phase, top: r.top + window.scrollY, height: r.height };
    });
  },

  /** Map scroll position → tick. The viewport's upper third is the read head. */
  onScroll(y: number, vh: number) {
    if (!sections.length) return;
    const h = vh || document.documentElement.clientHeight || 800; // hidden/embedded frames can report 0
    const head = y + h * 0.35;
    let target: { phase: Phase; top: number; height: number } = sections[0];
    for (const s of sections) if (head >= s.top) target = s;
    const local = Math.max(0, Math.min(1, (head - target.top) / target.height));
    setTick(phaseStart(target.phase) + local * PHASE_TICKS[target.phase]);
  },

  /** Signature interaction: SIGKILL a live node at the current tick. */
  kill(tile: number) {
    ensure();
    if (tile < 0 || tile >= N || !snap!.alive[tile]) return false;
    userFaults = [...userFaults, { tile, at: tick, by: "user" }];
    shrunk = null;
    recompute();
    return true;
  },

  /** Kill a deterministic "random" live node — used by the palette/terminal. */
  killAny() {
    ensure();
    const live: number[] = [];
    for (let i = 0; i < N; i++) if (snap!.alive[i] && snap!.power[i] > 0.5) live.push(i);
    if (!live.length) return -1;
    const tile = live[(tick * 7 + userFaults.length * 13) % live.length];
    return this.kill(tile) ? tile : -1;
  },

  /** Delta-debug the injected faults down to the minimal failing set. */
  shrink() {
    ensure();
    const faultsStart = phaseStart("faults");
    const all = [
      ...run!.chaos.map((f) => ({ ...f, at: f.at + faultsStart })),
      ...userFaults,
    ].filter((f) => f.at <= tick);
    const r = ddmin(run!, all, tick);
    shrunk = { from: all.length, to: r.minimal.length, steps: r.steps, tiles: r.minimal.map((f) => f.tile) };
    recompute();
    return shrunk;
  },

  /** New seed → new run. Written to the URL so the visit stays reproducible. */
  setSeed(next: number) {
    seed = next >>> 0;
    run = makeRun(seed, hues);
    userFaults = [];
    shrunk = null;
    try {
      const url = new URL(location.href);
      url.hash = `seed=${seedHex(seed)}`;
      history.replaceState(history.state, "", url);
    } catch { /* non-browser */ }
    recompute();
  },

  randomSeed() {
    this.setSeed((Math.random() * 0xffff) | 0);
    return seed;
  },

  subscribe(l: () => void) {
    listeners.add(l);
    return () => { listeners.delete(l); };
  },
};

/** React binding — re-renders on every simulator change (use sparingly;
    per-frame readers should read `sim.snapshot` directly). */
export function useSim() {
  const v = useSyncExternalStore(sim.subscribe, () => sim.version, () => 0);
  void v;
  return sim.snapshot;
}

/** Cheap subscription for surfaces that only care about rare changes.
    The cache lives in a ref so getSnapshot returns a stable value between
    store changes (React requires this; a per-render closure loops). */
export function useSimSelector<T>(select: (s: Snapshot) => T, isEqual: (a: T, b: T) => boolean = Object.is) {
  const selRef = useRef(select);
  const eqRef = useRef(isEqual);
  selRef.current = select;
  eqRef.current = isEqual;
  const cache = useRef<{ v: T } | null>(null);
  const get = useCallback(() => {
    const next = selRef.current(sim.snapshot);
    if (!cache.current || !eqRef.current(cache.current.v, next)) cache.current = { v: next };
    return cache.current.v;
  }, []);
  return useSyncExternalStore(sim.subscribe, get, get);
}

if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  (window as unknown as { __sim?: unknown }).__sim = sim;
}
