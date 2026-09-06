// ─────────────────────────────────────────────────────────────
// THE SIMULATOR — a deterministic run of a small dex-style cluster.
//
// Everything on screen is a pure function of (seed, tick, injected faults).
// No wall-clock time anywhere: scroll advances the tick, scrolling back
// rewinds the run, and `#seed=…` in the URL reproduces a visit exactly.
// The renderer (WebGL or DOM) only draws snapshots produced here.
// ─────────────────────────────────────────────────────────────

export const GRID = 6;
export const N = GRID * GRID;

export type Phase = "boot" | "lease" | "workflows" | "faults" | "shrink" | "exit";
export const PHASES: Phase[] = ["boot", "lease", "workflows", "faults", "shrink", "exit"];

// ticks per phase — the page maps each section's scroll span onto its phase
export const PHASE_TICKS: Record<Phase, number> = {
  boot: 240,
  lease: 240,
  workflows: 600,
  faults: 360,
  shrink: 240,
  exit: 200,
};
export const TOTAL_TICKS = PHASES.reduce((s, p) => s + PHASE_TICKS[p], 0);

const LEASE_TTL = 28; // ticks a dead node's lease survives before transfer
const RECOVER_AT = 90; // ticks after death when the node returns and writes stale

// ── PRNG ──────────────────────────────────────────────────────
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** `#seed=44`, `#seed=0x2A9F`, or the visitor's date — deterministic per day. */
export function seedFromLocation(hash = typeof location !== "undefined" ? location.hash : ""): number {
  const m = hash.match(/seed=(0x[0-9a-f]+|\d+)/i);
  if (m) return Number(m[1]) >>> 0;
  return hashString(new Date().toISOString().slice(0, 10)) & 0xffff;
}

export const seedHex = (s: number) => "0x" + s.toString(16).toUpperCase().padStart(4, "0");

// ── Fault model ───────────────────────────────────────────────
export type Fault = { tile: number; at: number; by: "user" | "chaos" };

// ── Run (precomputed from seed) ───────────────────────────────
export type Workflow = { hue: number; path: number[]; startAt: number };

export type Run = {
  seed: number;
  bootOrder: number[]; // tile power-on order
  workers: number[]; // workers per tile (1..3)
  workflows: Workflow[];
  chaos: Fault[]; // deterministic chaos during the faults phase
  facetShards: number[][]; // 4 groups of tiles claimed in the lease phase
};

function neighbors(i: number) {
  const x = i % GRID, y = (i / GRID) | 0;
  const out: number[] = [];
  if (x > 0) out.push(i - 1);
  if (x < GRID - 1) out.push(i + 1);
  if (y > 0) out.push(i - GRID);
  if (y < GRID - 1) out.push(i + GRID);
  return out;
}

export function makeRun(seed: number, hues: number[]): Run {
  const rnd = mulberry32(seed);
  const order = Array.from({ length: N }, (_, i) => i);
  for (let i = N - 1; i > 0; i--) {
    const j = (rnd() * (i + 1)) | 0;
    [order[i], order[j]] = [order[j], order[i]];
  }
  const workers = Array.from({ length: N }, () => 1 + ((rnd() * 3) | 0));

  // each workflow is a random walk across the grid — its event chain
  const workflows: Workflow[] = hues.map((hue, k) => {
    let at = (rnd() * N) | 0;
    const path = [at];
    const len = 9 + ((rnd() * 6) | 0);
    for (let s = 0; s < len; s++) {
      const nb = neighbors(at);
      at = nb[(rnd() * nb.length) | 0];
      path.push(at);
    }
    return { hue, path, startAt: k * 60 + ((rnd() * 40) | 0) };
  });

  const chaos: Fault[] = [];
  const chaosCount = 5 + ((rnd() * 3) | 0);
  for (let c = 0; c < chaosCount; c++) {
    chaos.push({ tile: (rnd() * N) | 0, at: 30 + ((rnd() * (PHASE_TICKS.faults - 160)) | 0), by: "chaos" });
  }
  chaos.sort((a, b) => a.at - b.at);

  // four facets claim four quadrants
  const facetShards: number[][] = [[], [], [], []];
  for (let i = 0; i < N; i++) {
    const x = i % GRID, y = (i / GRID) | 0;
    facetShards[(y < GRID / 2 ? 0 : 2) + (x < GRID / 2 ? 0 : 1)].push(i);
  }
  return { seed, bootOrder: order, workers, workflows, chaos, facetShards };
}

// ── Snapshot (pure function of run + tick + user faults) ──────
export type Snapshot = {
  tick: number;
  phase: Phase;
  local: number; // 0..1 within phase
  power: Float32Array; // tile brightness 0..1
  alive: Uint8Array;
  token: Uint16Array; // fencing token of the lease over tile i's shard
  holder: Int16Array; // which tile currently holds tile i's lease (-1 = none)
  activity: Float32Array; // worker pulse 0..1
  heads: { hue: number; tile: number; trail: number[] }[]; // workflow heads
  events: { tick: number; text: string; kind: "info" | "warn" | "fence" }[];
  faults: number;
  shrunk: number | null;
};

export function phaseAt(tick: number): { phase: Phase; local: number; start: number } {
  let start = 0;
  for (const p of PHASES) {
    const len = PHASE_TICKS[p];
    if (tick < start + len || p === "exit") {
      return { phase: p, local: Math.min(1, Math.max(0, (tick - start) / len)), start };
    }
    start += len;
  }
  return { phase: "exit", local: 1, start };
}

export function phaseStart(p: Phase) {
  let s = 0;
  for (const q of PHASES) {
    if (q === p) return s;
    s += PHASE_TICKS[q];
  }
  return s;
}

const smooth = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

/** Discrete-event simulation of leases and fencing up to `tick`. Deaths,
    lease transfers and stale returns are processed strictly in time order,
    so a node that dies and later returns cannot rescue a transfer that
    happened while it was down. */
function simulate(run: Run, tick: number, faults: Fault[]) {
  const alive = new Uint8Array(N).fill(1);
  const token = new Uint16Array(N).fill(1);
  const holder = new Int16Array(N);
  for (let i = 0; i < N; i++) holder[i] = i;
  const events: Snapshot["events"] = [];

  type Ev = { at: number; kind: "die" | "transfer" | "return"; tile: number; by: Fault["by"]; ok?: boolean };
  const queue: Ev[] = [];
  for (const f of faults) if (f.at <= tick) queue.push({ at: f.at, kind: "die", tile: f.tile, by: f.by });
  queue.sort((a, b) => a.at - b.at || (a.kind === "die" ? -1 : 1));

  const transferred = new Uint8Array(N); // did this shard's lease move while its node was down?
  for (let q = 0; q < queue.length; q++) {
    const e = queue[q];
    if (e.at > tick) break;
    if (e.kind === "die") {
      if (!alive[e.tile]) continue; // already down
      alive[e.tile] = 0;
      transferred[e.tile] = 0;
      events.push({ tick: e.at, text: `node ${e.tile} killed${e.by === "user" ? " (SIGKILL)" : ""}`, kind: "warn" });
      // schedule follow-ups, keeping the queue time-ordered
      const later: Ev[] = [
        { at: e.at + LEASE_TTL, kind: "transfer", tile: e.tile, by: e.by },
        { at: e.at + RECOVER_AT, kind: "return", tile: e.tile, by: e.by },
      ];
      for (const l of later) {
        let k = q + 1;
        while (k < queue.length && queue[k].at <= l.at) k++;
        queue.splice(k, 0, l);
      }
    } else if (e.kind === "transfer") {
      if (alive[e.tile]) continue; // came back before the lease expired
      const nb = neighbors(e.tile).filter((n) => alive[n]);
      if (nb.length) {
        token[e.tile] += 1;
        holder[e.tile] = nb[0];
        transferred[e.tile] = 1;
        events.push({ tick: e.at, text: `lease ${e.tile} → ${nb[0]}  (token ${token[e.tile]})`, kind: "info" });
      } else {
        holder[e.tile] = -1;
        events.push({ tick: e.at, text: `shard ${e.tile}: no live neighbour — unavailable`, kind: "warn" });
      }
    } else {
      if (alive[e.tile]) continue;
      alive[e.tile] = 1;
      if (transferred[e.tile]) {
        events.push({
          tick: e.at,
          text: `node ${e.tile} back — stale write rejected: token ${token[e.tile] - 1} < ${token[e.tile]}`,
          kind: "fence",
        });
      } else if (holder[e.tile] === -1) {
        holder[e.tile] = e.tile;
        events.push({ tick: e.at, text: `node ${e.tile} back — shard recovered`, kind: "info" });
      }
    }
  }
  const unavailable = Array.from(holder).filter((h) => h === -1).length;
  return { alive, token, holder, events, unavailable };
}

/** ddmin: the minimal subset of faults that still makes the cluster lose a
    shard. Real delta debugging — the count in the HUD is whatever it is. */
export function shrink(run: Run, faults: Fault[], atTick: number): { minimal: Fault[]; steps: number } {
  const fails = (set: Fault[]) => simulate(run, atTick, set).unavailable > 0;
  if (!fails(faults)) return { minimal: [], steps: 0 };
  let cur = faults;
  let n = 2;
  let steps = 0;
  while (cur.length >= 2) {
    const size = Math.ceil(cur.length / n);
    let reduced = false;
    for (let i = 0; i < cur.length; i += size) {
      const complement = [...cur.slice(0, i), ...cur.slice(i + size)];
      steps++;
      if (complement.length && fails(complement)) {
        cur = complement;
        n = Math.max(n - 1, 2);
        reduced = true;
        break;
      }
    }
    if (!reduced) {
      if (n >= cur.length) break;
      n = Math.min(cur.length, n * 2);
    }
  }
  return { minimal: cur, steps };
}

export function snapshot(run: Run, tick: number, userFaults: Fault[], shrunk: number | null): Snapshot {
  const { phase, local, start } = phaseAt(tick);
  const power = new Float32Array(N);
  const activity = new Float32Array(N);
  const rnd = mulberry32(run.seed ^ 0x9e37);
  const jitter = Array.from({ length: N }, () => rnd());

  // power: boot ramps tiles on in PRNG order; exit drains them in reverse
  const bootT = Math.min(1, tick / PHASE_TICKS.boot);
  for (let k = 0; k < N; k++) {
    const i = run.bootOrder[k];
    const on = smooth((bootT * N - k) / 4);
    power[i] = on;
  }
  if (phase === "exit") {
    for (let k = 0; k < N; k++) {
      const i = run.bootOrder[N - 1 - k];
      if (i === run.bootOrder[0]) continue; // one node stays lit for contact
      power[i] *= 1 - smooth((local * N - k) / 3);
    }
  }

  // worker activity: deterministic pulse keyed on tick, never on the clock
  for (let i = 0; i < N; i++) {
    activity[i] = 0.5 + 0.5 * Math.sin((tick + jitter[i] * 200) * 0.09) ;
  }

  // chaos faults only exist during/after the faults phase
  const faultsStart = phaseStart("faults");
  const chaos = run.chaos.map((f) => ({ ...f, at: f.at + faultsStart }));
  const all = [...chaos, ...userFaults];
  const sim = simulate(run, tick, all);

  // workflow heads crawl their paths during the workflows phase and stay parked
  const wfStart = phaseStart("workflows");
  const heads = run.workflows.map((w) => {
    const t = tick - wfStart - w.startAt;
    const stepsDone = Math.max(0, Math.min(w.path.length - 1, Math.floor(t / 24)));
    const idx = tick < wfStart ? -1 : stepsDone;
    return {
      hue: w.hue,
      tile: idx < 0 ? -1 : w.path[idx],
      trail: idx < 0 ? [] : w.path.slice(Math.max(0, idx - 4), idx),
    };
  });

  // narration for the quiet phases — pure functions of tick, so scrolling
  // back rewinds the log too
  const synth: Snapshot["events"] = [];
  const bootN = Math.min(N, Math.floor(bootT * N) + 1);
  for (let k = Math.max(0, bootN - 3); k < bootN; k++) {
    synth.push({ tick: Math.round((k / N) * PHASE_TICKS.boot), text: `node ${run.bootOrder[k]} powered on`, kind: "info" });
  }
  const leaseStart = phaseStart("lease");
  if (tick >= leaseStart) {
    const n = Math.min(N, Math.floor(((tick - leaseStart) / PHASE_TICKS.lease) * N) + 1);
    for (let k = Math.max(0, n - 3); k < n; k++) {
      const i = run.bootOrder[k];
      synth.push({ tick: leaseStart + Math.round((k / N) * PHASE_TICKS.lease), text: `lease ${i} acquired by node ${i}  (token 1)`, kind: "info" });
    }
  }
  run.workflows.forEach((w, k) => {
    const t = tick - wfStart - w.startAt;
    if (t < 0) return;
    const idx = Math.min(w.path.length - 1, Math.floor(t / 24));
    for (let s = Math.max(0, idx - 1); s <= idx; s++) {
      synth.push({ tick: wfStart + w.startAt + s * 24, text: `workflow 0${k + 1} → node ${w.path[s]}${s === w.path.length - 1 ? "  (completed)" : ""}`, kind: "info" });
    }
  });
  if (phase === "exit") {
    const n = Math.min(N, Math.floor(local * N) + 1);
    for (let k = Math.max(0, n - 3); k < n; k++) {
      const i = run.bootOrder[N - 1 - k];
      if (i !== run.bootOrder[0]) synth.push({ tick: phaseStart("exit") + Math.round((k / N) * PHASE_TICKS.exit), text: `node ${i} drained`, kind: "info" });
    }
  }
  const events = [...sim.events, ...synth].filter((e) => e.tick <= tick).sort((a, b) => a.tick - b.tick).slice(-6);

  return {
    tick,
    phase,
    local,
    power,
    alive: sim.alive,
    token: sim.token,
    holder: sim.holder,
    activity,
    heads,
    events,
    faults: all.filter((f) => f.at <= tick).length,
    shrunk,
  };
}
