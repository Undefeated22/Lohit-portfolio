"use client";

import { sim } from "./simStore";
import { GRID, N, type Snapshot } from "./sim";
import { projects, identity } from "@/data/portfolio";

// Plots the drawing's current state as an isometric blueprint SVG: the
// same tiles, rings, stakes and trails, plus a title block and the visit's
// event log. Pure function of the snapshot — a print of a deterministic run.
const W = 1400, H = 990;
const S = 62; // units → px
const cos30 = Math.cos(Math.PI / 6), sin30 = 0.5;
const ox = W * 0.56, oy = 330;
const iso = (x: number, z: number, y = 0) => ({ X: ox + (x - z) * cos30 * S, Y: oy + (x + z) * sin30 * S - y * S });
const tile = (i: number) => ({ x: (i % GRID) - (GRID - 1) / 2, z: Math.floor(i / GRID) - (GRID - 1) / 2 });
const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");

export function sheetSvg(): string {
  const s: Snapshot = sim.snapshot;
  const run = sim.run;
  const chalk = "#eef3ff", line = "#2a4a93", caution = "#ffd23f", bg = "#0b1f4f", surface = "#102a63";
  const parts: string[] = [];

  parts.push(`<rect width="${W}" height="${H}" fill="${bg}"/>`);
  // drafting grid
  for (let x = 0; x <= W; x += 64) parts.push(`<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${line}" stroke-opacity=".55"/>`);
  for (let y = 0; y <= H; y += 64) parts.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${line}" stroke-opacity=".55"/>`);

  // tiles, back to front (painter's order along x+z)
  const order = Array.from({ length: N }, (_, i) => i).sort((a, b) => (tile(a).x + tile(a).z) - (tile(b).x + tile(b).z));
  for (const i of order) {
    const pw = s.power[i];
    if (pw < 0.05) continue;
    const { x, z } = tile(i);
    const h = 0.46 * Math.min(1, pw * 1.25), t = 0.12;
    const p = [iso(x - h, z - h, t), iso(x + h, z - h, t), iso(x + h, z + h, t), iso(x - h, z + h, t)];
    const q = [iso(x - h, z - h, 0), iso(x + h, z - h, 0), iso(x + h, z + h, 0), iso(x - h, z + h, 0)];
    const fill = s.alive[i] ? surface : "#061238";
    // two visible sides + top
    parts.push(`<polygon points="${[q[3], q[2], p[2], p[3]].map((v) => `${v.X},${v.Y}`).join(" ")}" fill="${fill}" stroke="${chalk}" stroke-opacity=".5" stroke-width="1"/>`);
    parts.push(`<polygon points="${[q[2], q[1], p[1], p[2]].map((v) => `${v.X},${v.Y}`).join(" ")}" fill="${fill}" stroke="${chalk}" stroke-opacity=".5" stroke-width="1"/>`);
    parts.push(`<polygon points="${p.map((v) => `${v.X},${v.Y}`).join(" ")}" fill="${fill}" stroke="${chalk}" stroke-opacity=".9" stroke-width="1.2"/>`);
    // lease ring on the holder's tile (dashed), caution when orphaned
    const holder = s.holder[i];
    const at = holder >= 0 ? tile(holder) : { x, z };
    const c = iso(at.x + (holder >= 0 && holder !== i ? 0.18 : 0), at.z + (holder >= 0 && holder !== i ? -0.18 : 0), t + 0.02);
    parts.push(`<ellipse cx="${c.X}" cy="${c.Y}" rx="${0.27 * cos30 * S * 1.15}" ry="${0.27 * sin30 * S * 1.15}" fill="none" stroke="${holder === -1 ? caution : chalk}" stroke-width="2" stroke-dasharray="6 5"/>`);
    if (!s.alive[i]) {
      const st = iso(x - 0.3, z - 0.3, t), top = iso(x - 0.3, z - 0.3, t + 0.5);
      parts.push(`<line x1="${st.X}" y1="${st.Y}" x2="${top.X}" y2="${top.Y}" stroke="${caution}" stroke-width="3"/>`);
      parts.push(`<text x="${top.X + 8}" y="${top.Y - 4}" fill="${caution}" font-family="monospace" font-size="12" letter-spacing="1.5">n${i} · DOWN</text>`);
    }
  }
  // workflow trails
  run.workflows.forEach((w, k) => {
    const head = s.heads[k].tile;
    if (head < 0) return;
    const idx = w.path.indexOf(head);
    const pts = w.path.slice(0, Math.max(1, idx + 1)).map((ti) => { const { x, z } = tile(ti); const v = iso(x, z, 0.2); return `${v.X},${v.Y}`; });
    const hue = projects[k].hue;
    parts.push(`<polyline points="${pts.join(" ")}" fill="none" stroke="hsl(${hue} 85% 62%)" stroke-width="2.5" stroke-linejoin="round" stroke-opacity=".9"/>`);
    const hv = iso(tile(head).x, tile(head).z, 0.42);
    parts.push(`<polygon points="${hv.X},${hv.Y - 8} ${hv.X + 8},${hv.Y} ${hv.X},${hv.Y + 8} ${hv.X - 8},${hv.Y}" fill="hsl(${hue} 85% 62%)"/>`);
  });

  // title block
  const phase = s.phase.toUpperCase();
  const tb = 60;
  parts.push(`<g font-family="monospace" fill="${chalk}">
    <rect x="${tb}" y="${H - 250}" width="${W - tb * 2}" height="190" fill="none" stroke="${chalk}" stroke-width="1"/>
    <line x1="${tb}" y1="${H - 200}" x2="${W - tb}" y2="${H - 200}" stroke="${chalk}" stroke-width="1"/>
    <text x="${tb + 20}" y="${H - 218}" font-size="13" letter-spacing="2" fill="#8a9ccb">SHEET 07 / 07 — YOUR RUN · ${esc(identity.name)} · DETERMINISTIC SHARD CLUSTER</text>
    <text x="${W - tb - 20}" y="${H - 218}" font-size="13" letter-spacing="2" text-anchor="end" fill="#8a9ccb">SEED ${sim.seedHex} · TICK ${String(s.tick).padStart(6, "0")} · PHASE ${phase}</text>
    <text x="${tb + 20}" y="${H - 160}" font-size="34" font-weight="700" font-family="sans-serif">${s.faults} FAULT${s.faults === 1 ? "" : "S"} · ${s.shrunk === null ? "NOT SHRUNK" : `SHRUNK → ${s.shrunk}`} · ${s.alive.reduce((a, b) => a + b, 0)}/36 ALIVE</text>
    ${s.events.slice(-6).map((e, i) => `<text x="${tb + 20}" y="${H - 128 + i * 16}" font-size="12" letter-spacing="1" fill="${e.kind === "fence" ? caution : "#b7c6ea"}">${String(e.tick).padStart(6, "0")}  ${esc(e.text)}</text>`).join("")}
    <text x="${W - tb - 20}" y="${H - 128}" font-size="12" letter-spacing="1" text-anchor="end" fill="#8a9ccb">${esc(sim.shareUrl().replace(/^https?:\/\//, ""))}</text>
    <text x="${W - tb - 20}" y="${H - 108}" font-size="12" letter-spacing="1" text-anchor="end" fill="#8a9ccb">SCALE 1:36 · REV 2026.09 · lohit-portfolio</text>
  </g>`);
  // name, top left
  parts.push(`<text x="${tb}" y="120" font-family="sans-serif" font-weight="700" font-size="92" letter-spacing="-2" fill="${chalk}">${esc(identity.name)}</text>`);
  parts.push(`<text x="${tb}" y="158" font-family="monospace" font-size="14" letter-spacing="3" fill="#8a9ccb">${esc(identity.role.join(" "))} · SYSTEMS THAT SURVIVE FAILURE</text>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${parts.join("")}</svg>`;
}

/** Opens the printed sheet in a new tab (a real file: save it, share it). */
export function printSheet(): string {
  const svg = sheetSvg();
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  const w = window.open(url, "_blank", "noopener");
  if (!w) return "pop-up blocked — allow pop-ups to print the sheet";
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return `printed sheet 07 — seed ${sim.seedHex}, tick ${sim.tick}`;
}
