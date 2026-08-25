// ─────────────────────────────────────────────────────────────
// PORTFOLIO DATA LAYER — Lohit (github.com/Undefeated22)
// Single source of truth for all user-facing content.
// Sourced from resume + GitHub, Aug 2026.
// ─────────────────────────────────────────────────────────────

export const identity = {
  name: "LOHIT",
  legalName: "Lohit",
  role: ["BACKEND", "ENGINEER", "& BUILDER"],
  statement:
    "I build resilient backend systems —\ndurable execution, AI-driven incident\nresponse, real-time delivery.",
  location: "Hisar, Haryana, India — open to relocation",
  availability: "OPEN TO WORK",
  email: "11undefeated22@gmail.com",
  resumeUrl: "/resume.pdf",
};

export const socials = [
  { label: "GITHUB", href: "https://github.com/Undefeated22" },
  { label: "LINKEDIN", href: "https://www.linkedin.com/in/lohit-undefeated/" },
  { label: "RESUME", href: "/resume.pdf" },
];

export const about = {
  intro:
    "I'm a backend engineer who cares about what happens when things crash. I build systems that survive failure — and then I kill processes mid-execution to prove it.",
  facets: [
    {
      key: "BUILD",
      title: "I ship end-to-end, alone if needed",
      body: "Sole developer of Forge — API, workers, data layer, LLM pipeline and deploy. At Smartworks I took an internal CRM from local evaluation to a team-facing product.",
    },
    {
      key: "SYSTEMS",
      title: "Architecture before code",
      body: "Append-only event logs, shard leases with fencing, atomic upserts against racing webhooks, multi-tenant isolation. I think in failure modes first.",
    },
    {
      key: "VERIFY",
      title: "Correctness is a feature",
      body: "dex is tested by a deterministic simulator — every node, clock and scheduler driven off one seeded PRNG. One triage shrank 44 injected faults to 2.",
    },
    {
      key: "EXPERIMENT",
      title: "Curiosity as practice",
      body: "Streaming apps, multi-tenant SaaS, mobile SDK integrations, an OpenCV kiosk. Most experiments die; the lessons compound.",
    },
  ],
};

export type Project = {
  slug: string;
  index: string;
  name: string;
  tagline: string;
  role: string;
  year: string;
  tech: string[];
  // case study — 7 movements
  overview: string;
  problem: string;
  thinking: string;
  architecture: string;
  interfaceNotes: string;
  technology: string;
  outcome: string;
  github?: string;
  live?: string;
  // hue used by the generative preview (0–360)
  hue: number;
};

export const projects: Project[] = [
  {
    slug: "forge",
    index: "01",
    name: "FORGE",
    tagline: "AI incident investigation that diagnoses outages and remembers past failures.",
    role: "Sole Developer",
    year: "2026",
    tech: ["Node.js", "Fastify", "PostgreSQL", "pgvector", "Redis", "BullMQ"],
    overview:
      "Forge is a backend that ingests alerts from monitoring tools — Grafana, PagerDuty, Sentry, CloudWatch, Opsgenie — and runs autonomous LLM-driven root-cause investigations, building a causal graph of past failures so the system gets smarter with every incident.",
    problem:
      "Production alerts arrive as heterogeneous webhooks from half a dozen tools, often duplicated and racing each other. Root-cause investigation is manual, repetitive, and the knowledge from past incidents evaporates.",
    thinking:
      "Treat investigation as a background job pipeline, not a chat. Normalize everything at the edge, fingerprint incidents to kill duplicates atomically, and make the LLM layer a swappable seam instead of a hard dependency — the system should survive any single provider's quota or outage.",
    architecture:
      "A single-process Fastify 5 service runs the API alongside three BullMQ background workers on Redis, backed by Postgres + pgvector. The ingestion pipeline normalizes webhook payloads, fingerprints incidents, and prevents duplicate or racing incidents via atomic Postgres upserts.",
    interfaceNotes:
      "A REST API with RBAC-based multi-tenant isolation, field redaction and at-rest encryption, plus a web dashboard (deployed separately on Vercel) for browsing incidents and investigation results.",
    technology:
      "Node.js with Fastify 5, PostgreSQL with pgvector for semantic search, Redis with BullMQ for async jobs, and a provider-agnostic LLM seam — Groq for generation, Gemini for embeddings — with two-tier model routing and quota-aware rate limiting to operate entirely within free-tier caps.",
    outcome:
      "Live and deployed on Railway free tier. The entire service — API, three workers, vector search and LLM routing — runs in one process within free-tier limits, by design.",
    github: "https://github.com/Undefeated22/forge",
    live: "https://forge-frontend-xi.vercel.app",
    hue: 18,
  },
  {
    slug: "dex",
    index: "02",
    name: "DEX",
    tagline: "A durable execution engine in Go, verified by deterministic simulation.",
    role: "Sole Developer",
    year: "2026",
    tech: ["Go", "PostgreSQL", "Simulation Testing"],
    overview:
      "dex is a Temporal-style durable execution engine: workflows resume from exactly where they stopped after a crash. Instead of persisting runtime state, dex replays an append-only event log — the workflow's history is the source of truth.",
    problem:
      "Long-running workflows die with their process. Persisting runtime state is fragile and hard to reason about; most systems either lose work on crash or accumulate unverifiable recovery code.",
    thinking:
      "Event-sourced replay over persisted state — and determinism as a testable property, not a hope. If every source of nondeterminism is controlled, entire cluster runs become reproducible from a single seed, and failing runs can be shrunk like property-test cases.",
    architecture:
      "An append-only event log on Postgres, shard leases with fencing tokens, transfer and timer queues with ack levels, and a determinism linter that flags non-replayable calls — like time.Now — inside workflow code.",
    interfaceNotes:
      "dexctl, a CLI for operating the engine, and an embedded web dashboard for inspecting event histories and live workflow state.",
    technology:
      "Go and PostgreSQL, with a single-goroutine deterministic simulator that drives every node, the clock and the scheduler off one seeded PRNG — enabling reproducible fault injection and automatic shrinking of failing runs.",
    outcome:
      "Crash recovery verified against a real process killed mid-execution on Postgres. One real triage used simulation shrinking to reduce 44 injected faults to the 2 that mattered.",
    github: "https://github.com/Undefeated22/dex",
    hue: 210,
  },
  {
    slug: "a4-satta-king",
    index: "03",
    name: "A4 SATTA KING",
    tagline: "A real-time betting-results site pushing live updates to every connected client.",
    role: "Full-stack Developer",
    year: "2026",
    tech: ["Node.js", "Express.js", "SQLite", "Socket.io", "JWT"],
    overview:
      "A full-stack results platform: a public site plus a JWT-authenticated admin panel. When an admin publishes a result, every connected client sees it instantly over Socket.io.",
    problem:
      "Result publication needs to reach all viewers simultaneously — polling wastes bandwidth and still feels stale, and the admin surface has to be locked down against abuse.",
    thinking:
      "Push, don't poll. A single Socket.io broadcast channel for results, a REST API for everything else, and rate limiting at the edge to keep the public endpoints safe.",
    architecture:
      "Node.js with Express serving both the public site and the admin panel, a SQLite schema for results and users, Socket.io for live fan-out, and JWT auth guarding the admin surface.",
    interfaceNotes:
      "Two faces: a fast public results page, and an authenticated admin panel for publishing — updates propagate to all connected clients the moment they're saved.",
    technology:
      "Node.js, Express.js, SQLite, Socket.io and JWT, with rate limiting on the REST API.",
    outcome:
      "A complete shipped platform — public site, admin panel, real-time delivery and auth — built end-to-end.",
    github: "https://github.com/Undefeated22/A4-SATTA-KING",
    live: "https://a4sattaking.net/",
    hue: 130,
  },
];

export type Experiment = {
  name: string;
  category: string;
  tech: string;
  status: "LIVE" | "WIP" | "ARCHIVED";
  href?: string;
  // constellation position, % of container
  x: number;
  y: number;
};

export const experiments: Experiment[] = [
  { name: "DLX", category: "MULTI-TENANT SAAS", tech: "TypeScript", status: "WIP", href: "https://github.com/Undefeated22/dlx", x: 12, y: 28 },
  { name: "FORGE FRONTEND", category: "DASHBOARD", tech: "JavaScript", status: "LIVE", href: "https://forge-frontend-xi.vercel.app", x: 34, y: 62 },
  { name: "OBS", category: "STREAMING", tech: "Web", status: "ARCHIVED", href: "https://github.com/Undefeated22/obs", x: 55, y: 22 },
  { name: "YOUTUBE BACKEND", category: "API DESIGN", tech: "Node.js", status: "ARCHIVED", href: "https://github.com/Undefeated22/backend", x: 72, y: 55 },
  { name: "CASECOBRA", category: "E-COMMERCE", tech: "TypeScript", status: "ARCHIVED", href: "https://github.com/Undefeated22/casecobra", x: 88, y: 30 },
  { name: "FORMBRICKS × RN", category: "MOBILE SDK", tech: "Kotlin", status: "ARCHIVED", href: "https://github.com/Undefeated22/reactnative-formbricks", x: 24, y: 80 },
];

export const stack: { group: string; items: string[] }[] = [
  { group: "BACKEND", items: ["Node.js", "Fastify", "Express.js", "Go", "REST APIs", "Socket.io"] },
  { group: "LANGUAGES", items: ["JavaScript", "TypeScript", "Go", "Python", "Java", "C/C++"] },
  { group: "DATA", items: ["PostgreSQL", "pgvector", "MongoDB", "Redis", "SQLite", "ElasticSearch"] },
  { group: "ASYNC + AI", items: ["BullMQ", "LLM Pipelines", "Groq", "Gemini", "Simulation Testing"] },
  { group: "INFRA", items: ["Docker", "GitHub Actions", "CI/CD", "AWS", "Railway", "Linux"] },
  { group: "FRONTEND", items: ["React", "Next.js", "React Native", "Tailwind", "Drizzle ORM"] },
];

export type Milestone = {
  period: string;
  role: string;
  org: string;
  note: string;
  status: "ACTIVE" | "LOGGED";
};

export const journey: Milestone[] = [
  {
    period: "2025 — NOW",
    role: "Independent Engineering",
    org: "Forge / dex",
    note: "Building in public: an AI incident-investigation backend live on Railway, and a Go durable-execution engine verified by deterministic simulation.",
    status: "ACTIVE",
  },
  {
    period: "JUN — SEP 2025",
    role: "Software Development Intern",
    org: "Smartworks, Gurugram",
    note: "Shipped an internal CRM (self-hosted Twenty), FCM push notifications for a React Native app live on both stores, ElasticSearch-backed search, and an OpenCV face-recognition kiosk.",
    status: "LOGGED",
  },
];

export const education = {
  period: "GRAD. MAY 2026",
  degree: "B.Tech, Electronics & Communication",
  school: "Guru Jambheshwar University, Hisar",
  note: "Smart India Hackathon college-level qualifier — led development of an alumni association platform. Managed the university's Training & Placement Cell website.",
};

export const meta = {
  title: "LOHIT — Backend Engineer & Builder",
  description:
    "Portfolio of Lohit — backend engineer building durable execution engines, AI-driven incident response, and real-time platforms. Node.js, Go, PostgreSQL.",
  url: "https://example.com", // ⟨replace with your domain when you deploy⟩
};
