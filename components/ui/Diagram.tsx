"use client";

import { useEffect, useRef, useState } from "react";
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
  const [hover, setHover] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const active = hover ?? pinned;
  const svgRef = useRef<SVGSVGElement>(null);

  // plot the edges in order, like the cluster's wire; nodes appear behind the pen
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const paths = Array.from(svg.querySelectorAll<SVGPathElement>("path.dg-edge"));
    const nodes = Array.from(svg.querySelectorAll<SVGGElement>("g.dg-node"));
    const anims: Animation[] = [];
    paths.forEach((p, i) => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = `${len}`;
      p.style.strokeDashoffset = `${len}`;
      const a = p.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 520, delay: 120 + i * 110, easing: "cubic-bezier(0.16,1,0.3,1)", fill: "forwards" });
      a.onfinish = () => { p.style.strokeDasharray = ""; p.style.strokeDashoffset = ""; };
      anims.push(a);
    });
    nodes.forEach((n, i) => {
      anims.push(n.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: 200 + i * 90, fill: "backwards" }));
    });
    return () => anims.forEach((a) => a.cancel());
  }, [data]);
  const byId = Object.fromEntries(data.nodes.map((n) => [n.id, n]));
  const note = active ? byId[active]?.note : null;

  return (
    <figure className="rule bg-bg-deep/40 p-3 md:p-5">
      <style>{`
        @keyframes dg-flow { to { stroke-dashoffset: -28; } }
        .dg-edge { stroke: color-mix(in srgb, var(--color-text) 55%, transparent); fill: none; stroke-width: 1.2; stroke-dasharray: 6 8; }
        .dg-edge.on { stroke: var(--color-text); stroke-width: 1.8; animation: dg-flow 1.4s linear infinite; }
        .dg-node rect { fill: var(--color-surface); stroke: var(--color-text); stroke-width: 1; }
        .dg-node.hot rect { stroke-width: 2.5; }
        .dg-node.on rect { fill: var(--color-text); }
        .dg-node.on text { fill: var(--color-bg); }
        .dg-node text { fill: var(--color-text); font-family: var(--font-mono); font-size: 12px; }
        .dg-label { fill: var(--color-label); font-family: var(--font-mono); font-size: 9.5px; letter-spacing: .08em; text-transform: uppercase; }
        @media (prefers-reduced-motion: reduce) { .dg-edge { animation: none; } }
      `}</style>
      <div className="overflow-x-auto">
      <svg
        ref={svgRef}
        viewBox="0 0 800 360"
        className="h-auto w-full min-w-[560px]"
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
            aria-pressed={pinned === n.id}
            onMouseEnter={() => setHover(n.id)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(n.id)}
            onBlur={() => setHover(null)}
            onClick={() => setPinned((p) => (p === n.id ? null : n.id))}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setPinned((p) => (p === n.id ? null : n.id)); } }}
            style={{ cursor: n.note ? "help" : "default", outline: "none" }}
          >
            <rect x={n.x} y={n.y} width={n.w} height={n.h} />
            <text x={n.x + 10} y={n.y + n.h / 2 + 4}>{n.label}</text>
          </g>
        ))}
      </svg>
      </div>
      <figcaption className="mt-3 flex min-h-[1.5rem] items-baseline justify-between gap-4">
        <span className="type-label">{data.caption}</span>
        <span className="type-note text-right">{note ?? ""}</span>
      </figcaption>
    </figure>
  );
}
