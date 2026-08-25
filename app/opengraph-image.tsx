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
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#0a0a0b",
          color: "#ece9e2",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: "#ff5c1f",
            }}
          />
          <div style={{ fontSize: 24, letterSpacing: 4, color: "#8f8c85" }}>
            SYSTEM ONLINE — PORTFOLIO / 2026
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 160, fontWeight: 700, lineHeight: 0.95, letterSpacing: -6 }}>
            {identity.name}
            <span style={{ color: "#ff5c1f" }}>.</span>
          </div>
          <div style={{ fontSize: 52, fontWeight: 700, color: "#8f8c85", letterSpacing: -1 }}>
            {identity.role.join(" ")}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: "#7d7a73", letterSpacing: 3 }}>
          <div>FORGE / DEX / REAL-TIME SYSTEMS</div>
          <div>NODE.JS — GO — POSTGRESQL</div>
        </div>
      </div>
    ),
    size
  );
}
