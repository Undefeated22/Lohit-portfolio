import { ImageResponse } from "next/og";
import { identity, meta, projects } from "@/data/portfolio";
import { makeRun, snapshot, phaseStart, GRID, N } from "@/lib/sim";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = meta.title;

// The social card is the drawing itself: one fixed run (seed 0x2A9F), caught
// mid fault-injection so the stakes are up — rendered from the same pure
// simulator the page uses, at build time.
const SEED = 0x2a9f;
const chalk = "#eef3ff", line = "#2a4a93", caution = "#ffd23f", bg = "#0b1f4f", surface = "#102a63", deep = "#061238";
const S = 52;
const cos30 = Math.cos(Math.PI / 6), sin30 = 0.5;
const ox = 760, oy = 250;
const iso = (x: number, z: number, y = 0) => [ox + (x - z) * cos30 * S, oy + (x + z) * sin30 * S - y * S] as const;
const tile = (i: number) => ({ x: (i % GRID) - (GRID - 1) / 2, z: Math.floor(i / GRID) - (GRID - 1) / 2 });
const pts = (p: (readonly [number, number])[]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

export default function OpengraphImage() {
  const run = makeRun(SEED, projects.map((p) => p.hue));
  const s = snapshot(run, phaseStart("faults") + 70, [], null);
  const order = Array.from({ length: N }, (_, i) => i).sort((a, b) => tile(a).x + tile(a).z - (tile(b).x + tile(b).z));
  const shapes: React.ReactNode[] = [];
  for (const i of order) {
    if (s.power[i] < 0.05) continue;
    const { x, z } = tile(i);
    const h = 0.46, t = 0.12;
    const top = [iso(x - h, z - h, t), iso(x + h, z - h, t), iso(x + h, z + h, t), iso(x - h, z + h, t)];
    const base = [iso(x - h, z - h, 0), iso(x + h, z - h, 0), iso(x + h, z + h, 0), iso(x - h, z + h, 0)];
    const fill = s.alive[i] ? surface : deep;
    shapes.push(<polygon key={`l${i}`} points={pts([base[3], base[2], top[2], top[3]])} fill={fill} stroke={chalk} strokeOpacity={0.5} strokeWidth={1} />);
    shapes.push(<polygon key={`r${i}`} points={pts([base[2], base[1], top[1], top[2]])} fill={fill} stroke={chalk} strokeOpacity={0.5} strokeWidth={1} />);
    shapes.push(<polygon key={`t${i}`} points={pts(top)} fill={fill} stroke={chalk} strokeOpacity={0.9} strokeWidth={1.2} />);
    const holder = s.holder[i];
    const at = holder >= 0 ? tile(holder) : { x, z };
    const [cx, cy] = iso(at.x, at.z, t + 0.02);
    shapes.push(<ellipse key={`e${i}`} cx={cx} cy={cy} rx={0.27 * cos30 * S * 1.15} ry={0.27 * sin30 * S * 1.15} fill="none" stroke={holder === -1 ? caution : chalk} strokeWidth={2} strokeDasharray="6 5" />);
    if (!s.alive[i]) {
      const [sx, sy] = iso(x - 0.3, z - 0.3, t), [tx, ty] = iso(x - 0.3, z - 0.3, t + 0.5);
      shapes.push(<line key={`s${i}`} x1={sx} y1={sy} x2={tx} y2={ty} stroke={caution} strokeWidth={3} />);
    }
  }
  run.workflows.forEach((w, k) => {
    const head = s.heads[k].tile;
    if (head < 0) return;
    const idx = w.path.indexOf(head);
    const trail = w.path.slice(0, Math.max(1, idx + 1)).map((ti) => iso(tile(ti).x, tile(ti).z, 0.2));
    shapes.push(<polyline key={`w${k}`} points={pts(trail)} fill="none" stroke={`hsl(${projects[k].hue} 85% 62%)`} strokeWidth={2.5} strokeOpacity={0.9} />);
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", position: "relative", background: bg, color: chalk, fontFamily: "monospace",
          backgroundImage: `linear-gradient(to right, ${line} 1px, transparent 1px), linear-gradient(to bottom, ${line} 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
      >
        <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: "absolute", left: 0, top: 0 }}>
          {shapes}
        </svg>
        <div style={{ position: "absolute", left: 56, top: 44, display: "flex", flexDirection: "column", fontSize: 20, letterSpacing: 3, color: "#8a9ccb" }}>
          <div>SHEET 01 / 06 — DETERMINISTIC RUN · SEED 0x2A9F</div>
        </div>
        <div style={{ position: "absolute", left: 56, top: 220, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 132, fontWeight: 700, lineHeight: 0.95, letterSpacing: -4, fontFamily: "sans-serif" }}>{identity.name}</div>
          <div style={{ display: "flex", fontSize: 38, color: "#b7c6ea", marginTop: 10, fontFamily: "sans-serif" }}>{identity.role.join(" ")}</div>
          <div style={{ display: "flex", fontSize: 19, color: "#b7c6ea", marginTop: 26, letterSpacing: 1, maxWidth: 560 }}>I build systems that survive failure — and prove it. This portfolio is one: a seeded cluster you can kill, replay and print.</div>
        </div>
        <div style={{ position: "absolute", left: 56, bottom: 44, right: 56, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 19, letterSpacing: 3, color: "#8a9ccb" }}>
          <div>{`${s.faults} FAULTS INJECTED · ${s.alive.reduce((a, b) => a + b, 0)}/36 ALIVE · TICK ${String(s.tick).padStart(6, "0")}`}</div>
          <div style={{ background: caution, color: bg, padding: "8px 16px", fontWeight: 700 }}>OPEN TO WORK</div>
        </div>
      </div>
    ),
    size
  );
}
