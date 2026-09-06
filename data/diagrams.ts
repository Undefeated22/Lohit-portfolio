// Architecture diagrams per project — honest to the case-study text.
// Coordinates live in an 800×360 viewBox.
export type DNode = { id: string; x: number; y: number; w: number; h: number; label: string; note?: string; hot?: boolean };
export type DEdge = { from: string; to: string; label?: string };
export type Diagram = { nodes: DNode[]; edges: DEdge[]; caption: string };

export const diagrams: Record<string, Diagram> = {
  forge: {
    caption: "one process: API + three workers · atomic upserts stop racing alerts",
    nodes: [
      { id: "src", x: 20, y: 40, w: 150, h: 80, label: "Alert sources", note: "Grafana · PagerDuty · Sentry · CloudWatch · Opsgenie" },
      { id: "ingress", x: 220, y: 55, w: 130, h: 50, label: "Ingress", note: "normalize webhook payloads" },
      { id: "upsert", x: 400, y: 55, w: 150, h: 50, label: "Fingerprint + upsert", note: "atomic Postgres upsert — no duplicate / racing incidents", hot: true },
      { id: "queue", x: 400, y: 150, w: 150, h: 50, label: "Redis / BullMQ", note: "async job queue" },
      { id: "workers", x: 220, y: 150, w: 130, h: 50, label: "Workers ×3", note: "same process as the API" },
      { id: "llm", x: 220, y: 250, w: 130, h: 50, label: "LLM seam", note: "Groq (generation) | Gemini (embeddings) — swappable" },
      { id: "vec", x: 400, y: 250, w: 150, h: 50, label: "pgvector memory", note: "causal graph of past incidents" },
      { id: "api", x: 610, y: 150, w: 160, h: 50, label: "REST API + dashboard", note: "RBAC multi-tenant · field redaction" },
    ],
    edges: [
      { from: "src", to: "ingress", label: "webhooks" },
      { from: "ingress", to: "upsert" },
      { from: "upsert", to: "queue", label: "enqueue" },
      { from: "queue", to: "workers", label: "jobs" },
      { from: "workers", to: "llm", label: "investigate" },
      { from: "llm", to: "vec", label: "embed" },
      { from: "vec", to: "api" },
      { from: "upsert", to: "api", label: "incidents" },
    ],
  },
  dex: {
    caption: "the log is the state · every source of nondeterminism runs off one seed",
    nodes: [
      { id: "client", x: 20, y: 60, w: 120, h: 50, label: "Client", note: "starts workflows, signals" },
      { id: "api", x: 190, y: 60, w: 120, h: 50, label: "API", note: "dexctl · web dashboard" },
      { id: "lease", x: 360, y: 60, w: 150, h: 50, label: "Shard lease", note: "fencing tokens reject stale writers", hot: true },
      { id: "log", x: 560, y: 60, w: 200, h: 50, label: "Append-only event log", note: "PostgreSQL — the only persisted truth" },
      { id: "replay", x: 560, y: 170, w: 200, h: 50, label: "Replay", note: "fold history → workflow state after a crash" },
      { id: "queues", x: 360, y: 170, w: 150, h: 50, label: "Transfer / timer queues", note: "ack levels" },
      { id: "sim", x: 190, y: 270, w: 220, h: 50, label: "Deterministic simulator", note: "one seeded PRNG drives nodes, clock, scheduler · ddmin shrinks failing runs" },
      { id: "lint", x: 560, y: 270, w: 200, h: 50, label: "Determinism linter", note: "flags time.Now & friends in workflow code" },
    ],
    edges: [
      { from: "client", to: "api" },
      { from: "api", to: "lease", label: "acquire" },
      { from: "lease", to: "log", label: "append" },
      { from: "log", to: "replay", label: "on restart" },
      { from: "queues", to: "lease" },
      { from: "replay", to: "queues", label: "resume" },
      { from: "sim", to: "lease", label: "inject faults" },
      { from: "lint", to: "log" },
    ],
  },
  "a4-satta-king": {
    caption: "push, don't poll · one broadcast reaches every connected client",
    nodes: [
      { id: "admin", x: 20, y: 60, w: 140, h: 50, label: "Admin panel", note: "JWT-authenticated" },
      { id: "api", x: 230, y: 60, w: 150, h: 50, label: "Express API", note: "rate-limited REST" },
      { id: "db", x: 230, y: 180, w: 150, h: 50, label: "SQLite", note: "results · users" },
      { id: "io", x: 450, y: 60, w: 150, h: 50, label: "Socket.io", note: "single broadcast channel", hot: true },
      { id: "c1", x: 670, y: 20, w: 110, h: 40, label: "Client" },
      { id: "c2", x: 670, y: 90, w: 110, h: 40, label: "Client" },
      { id: "c3", x: 670, y: 160, w: 110, h: 40, label: "Client ×N" },
      { id: "public", x: 450, y: 180, w: 150, h: 50, label: "Public site", note: "fast results page" },
    ],
    edges: [
      { from: "admin", to: "api", label: "publish" },
      { from: "api", to: "db", label: "write" },
      { from: "api", to: "io", label: "emit" },
      { from: "io", to: "c1" },
      { from: "io", to: "c2" },
      { from: "io", to: "c3" },
      { from: "db", to: "public", label: "read" },
    ],
  },
  "rsyc-n": {
    caption: "balance is a sum, never a stored number · rotating the PIN kills every cookie at once",
    nodes: [
      { id: "member", x: 20, y: 60, w: 130, h: 50, label: "Members", note: "shared club PIN — no usernames" },
      { id: "open", x: 220, y: 20, w: 150, h: 44, label: "Open router", note: "no import path to ledger/member services" },
      { id: "viewer", x: 220, y: 100, w: 150, h: 44, label: "Viewer router", note: "PIN guard" },
      { id: "admin", x: 220, y: 180, w: 150, h: 44, label: "Admin / master", note: "record entries" },
      { id: "ledger", x: 440, y: 100, w: 170, h: 50, label: "Ledger service", note: "append-only after 15 min · reversals net to zero", hot: true },
      { id: "pin", x: 440, y: 210, w: 170, h: 50, label: "PIN version", note: "bump → every JWT cookie dies" },
      { id: "db", x: 670, y: 100, w: 110, h: 50, label: "MongoDB", note: "Atlas" },
      { id: "wa", x: 670, y: 210, w: 110, h: 50, label: "WhatsApp", note: "Cloud API notifications" },
    ],
    edges: [
      { from: "member", to: "open" },
      { from: "member", to: "viewer", label: "PIN" },
      { from: "member", to: "admin" },
      { from: "viewer", to: "ledger", label: "read" },
      { from: "admin", to: "ledger", label: "append" },
      { from: "ledger", to: "db" },
      { from: "pin", to: "viewer", label: "revoke" },
      { from: "admin", to: "wa", label: "notify" },
    ],
  },
  "chess-analyser": {
    caption: "the engine belongs on the client · no server, no queue, no bill",
    nodes: [
      { id: "pgn", x: 20, y: 40, w: 130, h: 50, label: "PGN / username", note: "Chess.com public API — last 3 archives" },
      { id: "parse", x: 210, y: 40, w: 140, h: 50, label: "chess.js", note: "legality · PGN parsing" },
      { id: "worker", x: 420, y: 40, w: 180, h: 50, label: "Web Worker", note: "Stockfish 16 NNUE · WebAssembly", hot: true },
      { id: "eval", x: 420, y: 160, w: 180, h: 50, label: "Evaluator", note: "centipawn loss → Best / Good / Inaccuracy / Mistake / Blunder" },
      { id: "ui", x: 210, y: 160, w: 140, h: 50, label: "Board + eval bar", note: "react-chessboard" },
      { id: "assets", x: 420, y: 270, w: 180, h: 50, label: "Same-origin assets", note: "postinstall copies NNUE into public/" },
    ],
    edges: [
      { from: "pgn", to: "parse" },
      { from: "parse", to: "worker", label: "FEN per move" },
      { from: "worker", to: "eval", label: "UCI scores" },
      { from: "eval", to: "ui", label: "classification" },
      { from: "assets", to: "worker", label: "loads" },
    ],
  },
};
