import { ImageResponse } from "next/og";
import { identity, meta } from "@/data/portfolio";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = meta.title;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between",
          padding: 72, background: "#0b1f4f", color: "#eef3ff", fontFamily: "monospace",
          backgroundImage: "linear-gradient(to right, #2a4a93 1px, transparent 1px), linear-gradient(to bottom, #2a4a93 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, letterSpacing: 4, color: "#8a9ccb" }}>
          <div>SHEET 01 / 06 — BOOT</div>
          <div>SEED 0x2A9F · TICK 000000</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 150, fontWeight: 700, lineHeight: 0.95, letterSpacing: -4 }}>{identity.name}</div>
          <div style={{ display: "flex", fontSize: 44, color: "#b7c6ea", marginTop: 12 }}>{identity.role.join(" ")}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 22, letterSpacing: 3, color: "#8a9ccb" }}>
          <div>SYSTEMS THAT SURVIVE FAILURE — DEX · FORGE · A4</div>
          <div style={{ background: "#ffd23f", color: "#0b1f4f", padding: "8px 16px", fontWeight: 700 }}>OPEN TO WORK</div>
        </div>
      </div>
    ),
    size
  );
}
