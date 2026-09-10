// ─────────────────────────────────────────────────────────────
// PORTFOLIO DATA LAYER — Lohit (github.com/Undefeated22)
// Single source of truth for all user-facing content.
// Sourced from the resume (rebuilt Sep 2026) + GitHub. Claims here must be
// backed by the resume — never let the two disagree.
// ─────────────────────────────────────────────────────────────

export const identity = {
  name: "LOHIT",
  legalName: "Lohit",
  role: ["BACKEND", "ENGINEER", "& BUILDER"],
  statement:
    "I build systems that survive failure, and prove it: a durable-execution engine, an LLM incident-investigation backend, a ledger where balances are derived and never mutated.",
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
      body: "Streaming apps, multi-tenant SaaS, a browser-only chess engine, mobile SDK integrations. Prototypes are how I learn what a system actually needs.",
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
    hue: 190,
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
  {
    slug: "rsyc-n",
    index: "04",
    name: "RSYC-N",
    tagline: "A shared fund ledger and noticeboard for a village youth club — PIN-gated, append-only, built for phones.",
    role: "Sole Developer",
    year: "2026",
    tech: ["Node.js", "Express.js", "MongoDB", "React", "JWT"],
    overview:
      "RSYC is the treasury and noticeboard for Rao Shekha Ji Yuva Club, Nangla. Members contribute a fixed amount every month; anyone holding the club PIN can see the balance and every rupee that has left it. Admins record. Nobody needs a username.",
    problem:
      "A village club's money lives in one person's notebook and a stream of WhatsApp screenshots. Members cannot verify the balance, disputes have no evidence, and every member's phone number is one forwarded screenshot away from leaking.",
    thinking:
      "Money is a whole number of rupees, never a float. The balance is a sum over entries, never a stored number. Entries become append-only after fifteen minutes — corrections are reversals that net to zero, not edits. Identity is a shared PIN, and rotating it is the entire revocation story: bump a version, every cookie in the village dies at once.",
    architecture:
      "Three Express routers behind three guards — open, viewer, admin and master. The open router has no import path to the ledger, member or dues services, so a phone number cannot leak through a mistaken conditional. Credits carry their month allocation, so the row that moves the balance is the row that settles dues; contribution plans have effective dates, so history keeps the amount that was in force at the time.",
    interfaceNotes:
      "Mobile-first React in a Shekhawati palette — indigo, marigold, oxblood, brass. Every ornament is SVG drawn in the browser: a jharokha crest, a jali screen behind the balance card, deterministic mandala covers per event. Rozha One and Mukta so Hindi names set properly beside English. Light and dark, safe-area insets, 44px tap targets.",
    technology:
      "Node.js with Express 4, Mongoose 8 on MongoDB Atlas, a bcrypt-hashed PIN, JWT httpOnly cookies carrying the current pinVersion, express-rate-limit at the edge. React 18 with React Router and Vite. Deploys as one Vercel project — static client plus a single serverless function for the API — with optional Cloudinary uploads and WhatsApp Cloud API notifications.",
    outcome:
      "A complete club treasury — ledger, dues, members, events, join requests, audit log — with no member accounts and a revocation model that needs no session table.",
    github: "https://github.com/Undefeated11/RSYC-N",
    hue: 265,
  },
  {
    slug: "chess-analyser",
    index: "05",
    name: "CHESS ANALYSER",
    tagline: "A browser-only game analyser running Stockfish 16 in WebAssembly.",
    role: "Sole Developer",
    year: "2026",
    tech: ["React", "Vite", "Tailwind", "Stockfish", "WebAssembly"],
    overview:
      "Paste a PGN or type a Chess.com username, and every move of the game is evaluated by Stockfish 16 running entirely in the browser. No server, no account, no upload.",
    problem:
      "Post-game analysis usually sits behind a subscription, or behind a server that has to run an engine per user. Casual players want to know where a game turned without paying for it, and without their games leaving the device.",
    thinking:
      "The engine belongs on the client. A single-threaded NNUE WASM build is fast enough for move-by-move evaluation of a full game at depth 14, and keeping everything in the browser removes the server, the queue and the bill.",
    architecture:
      "A Web Worker hosts Stockfish and answers UCI evaluation requests one FEN at a time. A game-analysis hook walks the move list, normalises centipawn scores to the side to move — mates mapped to a saturated score — and classifies each move by centipawn loss into Best, Good, Inaccuracy, Mistake or Blunder. Chess.com's public API supplies the last three monthly archives for a username.",
    interfaceNotes:
      "A landing page with a PGN importer and a Chess.com fetcher; an analyser view with the board, an eval bar, the engine's best line and a move navigator carrying a classification badge per move. Light and dark themes.",
    technology:
      "React 18, Vite and Tailwind CSS; chess.js for legality and PGN parsing, react-chessboard, framer-motion. A postinstall script copies the Stockfish NNUE assets into public/ so the engine is served same-origin and the Worker can load it without CORS.",
    outcome:
      "Full-game engine analysis with zero backend. Open a PGN and the engine is already warm.",
    github: "https://github.com/Undefeated11/Chess_Analyser",
    hue: 170,
  },
  {
    slug: "brokerage-portal",
    index: "06",
    name: "BROKERAGE PORTAL",
    tagline: "A trading client portal where money is BigInt and balances are derived, never mutated.",
    role: "Sole Engineer — contract",
    year: "2026",
    tech: ["Next.js", "TypeScript", "PostgreSQL", "Prisma", "Zod", "Server-Sent Events"],
    overview:
      "A brokerage client portal built alone under contract: 55 routes over an 80-model Postgres schema spanning identity, KYC, ledger, markets, copy trading and analytics. Client work — described here at the same level as the resume, no more.",
    problem:
      "A brokerage cannot afford a balance that drifts, a withdrawal that skips a check, or a quote feed that lies. Every mistake here is money.",
    thinking:
      "Treat the database as the last line of defence. Balances are never stored — they are sums over an append-only ledger. Authorization lives in one server-side data-access layer so no route can forget it. Every defect found becomes an invariant check that fails if it ever returns.",
    architecture:
      "Money as BigInt minor units on an append-only ledger with derived balances; composite foreign keys so Postgres itself rejects a ledger leg in a currency the account cannot hold. KYC and funding gates as server guards, TOTP step-up auth, four-eyes approval on admin withdrawals.",
    interfaceNotes:
      "Live quotes and candles streamed over Server-Sent Events behind mockable provider seams, so the portal runs — and tests — without a live market.",
    technology:
      "Next.js 16, TypeScript, PostgreSQL 17, Prisma 7, Zod. 28 invariant checks, each pinned to a past defect.",
    outcome:
      "In production for the client. The ledger has never needed a manual balance correction — the schema does not allow one.",
    hue: 330,
  },
];

// SHEET 00 — the portfolio itself, held to the same standard as the work.
export const colophon: Project = {
  slug: "this-drawing",
  index: "00",
  name: "THIS DRAWING",
  tagline: "The portfolio is a deterministic simulation of a shard cluster — seeded, replayable, printable.",
  role: "Design + Engineering",
  year: "2026",
  tech: ["Next.js 16", "React Three Fiber", "GLSL", "postprocessing", "Lenis", "TypeScript"],
  overview:
    "Everything behind this page is one run of a 6×6 shard cluster: leases, fencing tokens, workflows, chaos and a delta-debugging shrinker. Scroll is the clock. The seed — and every node you kill — lives in the URL, so a link reproduces a visit exactly. It is built on the same idea as dex: if every source of nondeterminism is controlled, a run is a pure function of its inputs.",
  problem:
    "A portfolio is usually a page that describes engineering. Mine wanted to be the engineering: a system you can break in front of you, that recovers the way my real systems do, and that proves it by being reproducible.",
  thinking:
    "Nothing on the drawing may depend on wall-clock time — only on (seed, tick, faults). Then scrolling back is a genuine rewind, a URL is a complete run, and replay is trivially correct. The 3D layer is a renderer of that state, never a source of it. The DOM owns every word; WebGL owns only the drawing.",
  architecture:
    "lib/sim.ts is a pure, time-ordered discrete-event simulator (mulberry32 PRNG, per-shard leases with fencing tokens, transfer/return queues, a real ddmin shrinker). lib/simStore.ts maps [data-phase] sections to phases and scroll to ticks, and publishes the seed and your kills to the URL hash. components/three/Cluster.tsx renders the snapshot with five instanced meshes plus a self-plotting wireframe; Scene.tsx runs a tiered post chain — SMAA, bloom on emissive rings, a custom depth-edge + ordered-dither 'blueprint' effect.",
  interfaceNotes:
    "A HUD narrates the run in plain words; drafting captions land on affected nodes; ⌘K opens a zero-dependency command palette on a native <dialog>; '/' opens a terminal sharing the same command registry; case studies are event histories with plotted architecture diagrams; R replays the visit from tick 0; P prints the sheet as SVG or PNG.",
  technology:
    "Next.js 16 static prerender, React 19, @react-three/fiber 9.7, three 0.185, @react-three/postprocessing 3.1 with a custom Effect (EffectAttribute.DEPTH, linearised depth Laplacian, closed-form 4×4 Bayer, R-plate misregistration), Lenis, Tailwind v4 tokens. Hydration-safe by rule: nothing seed-derived reaches the DOM before mount. Accessibility: focus-trapped dialogs, shortcuts with an off switch, reduced-motion path that keeps the drawing static but complete.",
  outcome:
    "One idea executed with restraint: a cobalt blueprint that plots itself on arrival, breaks when you tell it to, heals by the rules of fencing, shrinks your faults to the ones that mattered, and hands you a file at the end. Reviewed by 40+ specialist agents across design, GLSL, React and accessibility lenses; every confirmed finding applied.",
  github: "https://github.com/Undefeated22/Lohit-portfolio",
  hue: 222,
};

export type Experiment = {
  name: string;
  category: string;
  tech: string;
  status: "LIVE" | "WIP" | "ARCHIVED";
  href?: string;
};

export const experiments: Experiment[] = [
  { name: "DLX", category: "MULTI-TENANT SAAS", tech: "TypeScript", status: "WIP", href: "https://github.com/Undefeated22/dlx" },
  { name: "FORGE FRONTEND", category: "DASHBOARD", tech: "JavaScript", status: "LIVE", href: "https://forge-frontend-xi.vercel.app" },
  { name: "OBS", category: "STREAMING", tech: "Web", status: "ARCHIVED", href: "https://github.com/Undefeated22/obs" },
  { name: "YOUTUBE BACKEND", category: "API DESIGN", tech: "Node.js", status: "ARCHIVED", href: "https://github.com/Undefeated22/backend" },
  { name: "CASECOBRA", category: "E-COMMERCE", tech: "TypeScript", status: "ARCHIVED", href: "https://github.com/Undefeated22/casecobra" },
  { name: "FORMBRICKS × RN", category: "MOBILE SDK", tech: "Kotlin", status: "ARCHIVED", href: "https://github.com/Undefeated22/reactnative-formbricks" },
  { name: "AMS", category: "DESKTOP APP", tech: "Java · Swing · MySQL", status: "ARCHIVED", href: "https://github.com/Undefeated11/Ams" },
];

export const stack: { group: string; items: string[] }[] = [
  { group: "LANGUAGES", items: ["Go", "TypeScript", "JavaScript", "Python", "SQL", "Java", "C/C++"] },
  { group: "BACKEND", items: ["Node.js", "Fastify", "Express.js", "REST APIs", "Event sourcing", "BullMQ", "Socket.io", "Server-Sent Events", "JWT", "RBAC"] },
  { group: "DATA", items: ["PostgreSQL", "pgvector", "MongoDB", "Redis", "SQLite", "ElasticSearch", "Prisma", "Drizzle ORM"] },
  { group: "AI", items: ["Groq", "Gemini", "Embeddings", "Vector search", "Simulation Testing"] },
  { group: "INFRA", items: ["Docker", "GitHub Actions", "CI/CD", "Linux", "Railway", "Vercel"] },
  { group: "FRONTEND", items: ["React", "Next.js", "React Native", "Tailwind", "Radix UI"] },
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
    period: "2026 — NOW",
    role: "Freelance Backend Engineer",
    org: "Brokerage client (contract)",
    note: "Sole engineer on a trading client portal: 55 routes over an 80-model Postgres schema. Money as BigInt minor units on an append-only ledger with derived balances; composite foreign keys so Postgres rejects a ledger leg in a currency the account cannot hold; TOTP step-up and four-eyes approval on admin withdrawals; live quotes over Server-Sent Events; 28 invariant checks that each fail if a past defect returns.",
    status: "ACTIVE",
  },
  {
    period: "2025 — 2026",
    role: "Independent Engineering",
    org: "dex / Forge",
    note: "A Go durable-execution engine verified by deterministic simulation, and an AI incident-investigation backend live on Railway — both built in public.",
    status: "LOGGED",
  },
  {
    period: "JUN — SEP 2025",
    role: "Software Development Intern",
    org: "Smartworks, Gurugram",
    note: "Took Twenty (open-source CRM) from local evaluation to a self-hosted team product, traced KPI and ticket-assignment defects through MongoDB aggregation pipelines, built ElasticSearch-backed search, and shipped FCM push for a React Native app live on both stores.",
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
  url: "https://lohit-portfolio-drab.vercel.app",
};
