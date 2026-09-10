"use client";

import { sim } from "./simStore";
import type { Snapshot } from "./sim";

// The run is a song. Every simulator event maps to a deterministic sound —
// same seed, same piece; scroll is the playhead. Off by default; synthesised
// on the fly, so there is nothing to download and nothing to license.
const KEY = "sound-on";
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let on = false;
let lastTick = -1;
let unsub: (() => void) | null = null;

export const soundOn = () => on;

function ensureGraph() {
  if (ctx) return;
  ctx = new AudioContext();
  master = ctx.createGain();
  master.gain.value = 0.11;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 2600;
  master.connect(lp).connect(ctx.destination);
}

// C major pentatonic over two octaves: tile index → pitch (rows climb)
const PENTA = [0, 2, 4, 7, 9];
const pitch = (tile: number) => 196 * Math.pow(2, (PENTA[tile % 5] + Math.floor((tile % 12) / 6) * 12 + Math.floor(tile / 12) * 3) / 12);

function tone(f: number, o: { type?: OscillatorType; dur?: number; vol?: number; slideTo?: number; at?: number } = {}) {
  if (!ctx || !master) return;
  const t = ctx.currentTime + (o.at ?? 0);
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = o.type ?? "triangle";
  osc.frequency.setValueAtTime(f, t);
  if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, t + (o.dur ?? 0.2) * 0.7);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(o.vol ?? 1, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0008, t + (o.dur ?? 0.2));
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + (o.dur ?? 0.2) + 0.05);
}

function thud(at = 0) {
  if (!ctx || !master) return;
  const t = ctx.currentTime + at;
  tone(72, { type: "sine", dur: 0.42, vol: 1.6, slideTo: 40, at });
  const len = Math.floor(ctx.sampleRate * 0.12);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) * 0.5;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const g = ctx.createGain();
  g.gain.value = 0.35;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 500;
  src.connect(bp).connect(g).connect(master);
  src.start(t);
}

/** one sound per narrative event, pitched by the node it concerns */
function play(e: Snapshot["events"][number], at: number) {
  const m = /(?:node|lease|shard|workflow 0?)(\d+)/.exec(e.text);
  const n = m ? Number(m[1]) : 0;
  const f = pitch(n % 36);
  if (/powered on/.test(e.text)) tone(f, { dur: 0.16, vol: 0.5, at });
  else if (/^lease \d+ acquired/.test(e.text)) { tone(f, { dur: 0.14, vol: 0.55, at }); tone(f * 1.5, { dur: 0.22, vol: 0.45, at: at + 0.09 }); }
  else if (/^workflow/.test(e.text)) tone(f * 2, { type: "sine", dur: 0.12, vol: 0.4, at });
  else if (/killed/.test(e.text)) thud(at);
  else if (/^lease \d+ →/.test(e.text)) tone(f, { dur: 0.32, vol: 0.6, slideTo: f * 1.5, at });
  else if (e.kind === "fence") { tone(f, { type: "square", dur: 0.09, vol: 0.35, at }); tone(f * 1.4142, { type: "square", dur: 0.14, vol: 0.35, at: at + 0.04 }); }
  else if (/recovered/.test(e.text)) { tone(f, { dur: 0.3, vol: 0.4, at }); tone(f * 1.25, { dur: 0.3, vol: 0.35, at: at + 0.05 }); tone(f * 1.5, { dur: 0.36, vol: 0.3, at: at + 0.1 }); }
  else if (/drained/.test(e.text)) tone(f, { dur: 0.26, vol: 0.4, slideTo: f * 0.5, at });
  else if (/no live neighbour/.test(e.text)) tone(f * 0.5, { type: "sawtooth", dur: 0.4, vol: 0.3, at });
}

function onChange() {
  if (!on || !ctx) return;
  const s = sim.snapshot;
  const t = s.tick;
  if (lastTick < 0) { lastTick = t; return; }
  if (t > lastTick) {
    // forward only: rewinding is silent, like a tape scrubbed backwards
    const fresh = s.events.filter((e) => e.tick > lastTick && e.tick <= t).slice(-6);
    fresh.forEach((e, i) => play(e, i * 0.045));
  }
  lastTick = t;
}

export async function setSound(next: boolean) {
  on = next;
  try { localStorage.setItem(KEY, next ? "1" : "0"); } catch { /* ignore */ }
  if (next) {
    ensureGraph();
    await ctx!.resume();
    lastTick = sim.tick;
    unsub ??= sim.subscribe(onChange);
    tone(pitch(0), { dur: 0.18, vol: 0.5 });
    tone(pitch(0) * 1.5, { dur: 0.3, vol: 0.4, at: 0.1 });
  } else {
    await ctx?.suspend();
  }
  dispatchEvent(new CustomEvent("lohit:sound", { detail: next }));
}

/** restore a previous opt-in — only after a user gesture, per autoplay policy */
export function soundPreferred() {
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
}
