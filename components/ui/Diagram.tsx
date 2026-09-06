"use client";

import { useState } from "react";
import type { Diagram as DiagramT, DNode } from "@/data/diagrams";

// Hand-rolled SVG architecture diagram: chalk boxes, bezier edges with a
// flowing dash, hover/focus lights a node's edges. No layout library.
const center = (n: DNode) => ({ x: n.x + n.w / 2, y: n.y + n.h / 2 });

function edgePath(a: DNode, b: DNode) {
  const ca = center(a), cb = center(b);
  const horizontal = Math.abs(cb.x - ca.x) > Math.abs(cb.y - ca.y);
  const sx = horizontal ? (cb.x > ca.x ? a.x + a.w : a.x) : ca.x;
  const sy = horizontal ? ca.y : cb.y > ca.y ? a.y + a.h : a.y;
  const ex = horizontal ? (cb.x > ca.x ? b.x : b.x + b.w) : cb.x;
  const ey = horizontal ? cb.y : cb.y > ca.y ? b.y : b.y + b.h;
  const c1 = horizontal ? `${(sx + ex) / 2},${sy}` : `${sx},${(sy + ey) / 2}`;
  const c2 = horizontal ? `${(sx + ex) / 2},${ey}` : `${ex},${(sy + ey) / 2}`;
  return { d: `M${sx},${sy} C${c1} ${c2} ${ex},${ey}`, mx: (sx + ex) / 2, my: (sy + ey) / 2 };
}

export default function Diagram({ data, title }: { data: DiagramT; title: string }) {
  const [active, setActive] = useState<string | null>(null);
  const byId = Object.fromEntries(data.nodes.map((n) => [n.id, n]));
  const note = active ? byId[active]?.note : null;

  return (
    <figure className="rule bg-bg-deep/40 p-3 md:p-5">
      <style>{`
        @keyframes dg-flow { to { stroke-dashoffset: -28; } }
        .dg-edge { stroke: color-mix(in srgb, var(--color-text) 35%, transparent); fill: none; stroke-width: 1.2; stroke-dasharray: 6 8; animation: dg-flow 1.4s linear infinite; }
        .dg-edge.on { stroke: var(--color-accent); stroke-width: 1.8; }
        .dg-node rect { fill: var(--color-surface); stroke: var(--color-text); stroke-width: 1; }
        .dg-node.hot rect { stroke: var(--color-accent); }
        .dg-node.on rect { fill: var(--color-accent); }
        .dg-node.on text { fill: var(--color-bg); }
        .dg-node text { fill: var(--color-text); font-family: var(--font-mono); font-size: 12px; }
        .dg-label { fill: var(--color-label); font-family: var(--font-mono); font-size: 9.5px; letter-spacing: .08em; text-transform: uppercase; }
        @media (prefers-reduced-motion: reduce) { .dg-edge { animation: none; } }
      `}</style>
      <svg
        viewBox="0 0 800 360"
        className="h-auto w-full"
        role="group"
        aria-label={`${title} architecture diagram`}
      >
        {data.edges.map((e, i) => {
          const a = byId[e.from], b = byId[e.to];
          if (!a || !b) return null;
          const { d, mx, my } = edgePath(a, b);
          const on = active === e.from || active === e.to;
          return (
            <g key={i}>
              <path d={d} className={`dg-edge ${on ? "on" : ""}`} />
              {e.label && (
                <text x={mx} y={my - 6} textAnchor="middle" className="dg-label">
                  {e.label}
                </text>
              )}
            </g>
          );
        })}
        {data.nodes.map((n) => (
          <g
            key={n.id}
            className={`dg-node ${n.hot ? "hot" : ""} ${active === n.id ? "on" : ""}`}
            tabIndex={0}
            role="button"
            aria-label={`${n.label}${n.note ? ` — ${n.note}` : ""}`}
            onMouseEnter={() => setActive(n.id)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(n.id)}
            onBlur={() => setActive(null)}
            style={{ cursor: n.note ? "help" : "default", outline: "none" }}
          >
            <rect x={n.x} y={n.y} width={n.w} height={n.h} />
            <text x={n.x + 10} y={n.y + n.h / 2 + 4}>{n.label}</text>
          </g>
        ))}
      </svg>
      <figcaption className="mt-3 flex min-h-[1.5rem] items-baseline justify-between gap-4">
        <span className="type-label">{data.caption}</span>
        <span className="type-note text-right" aria-live="polite">{note ?? ""}</span>
      </figcaption>
    </figure>
  );
}
