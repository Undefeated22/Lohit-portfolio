"use client";

import { useEffect, useState } from "react";

// Live GitHub activity, merged across both accounts. Unauthenticated public
// events API: CORS-open, 60 req/hr per IP, 5-minute CDN cache — so we cache
// the merged feed in sessionStorage and fall back silently when offline
// or rate-limited. Payloads are treated as data, never rendered as HTML.
export const GITHUB_ACCOUNTS = ["Undefeated11", "Undefeated22"] as const;

export type GhEvent = {
  id: string;
  type: string; // PushEvent, CreateEvent, ForkEvent, ...
  repo: string; // owner/name
  at: string; // ISO timestamp
  detail: string; // human line: "3 commits to main", "created repo", ...
};

type RawEvent = {
  id: string;
  type: string;
  repo: { name: string };
  created_at: string;
  payload?: {
    ref?: string | null;
    ref_type?: string;
    size?: number;
    commits?: { message: string }[];
    action?: string;
  };
};

function describe(e: RawEvent): string {
  const p = e.payload ?? {};
  const branch = (p.ref ?? "").replace("refs/heads/", "");
  switch (e.type) {
    case "PushEvent": {
      const n = p.size ?? p.commits?.length ?? 0;
      return `${n} commit${n === 1 ? "" : "s"} → ${branch || "main"}`;
    }
    case "CreateEvent":
      return p.ref_type === "repository" ? "created repository" : `created ${p.ref_type} ${branch}`;
    case "ForkEvent":
      return "forked";
    case "WatchEvent":
      return "starred";
    case "PullRequestEvent":
      return `${p.action ?? "opened"} pull request`;
    case "IssuesEvent":
      return `${p.action ?? "opened"} issue`;
    case "ReleaseEvent":
      return "published release";
    default:
      return e.type.replace(/Event$/, "").toLowerCase();
  }
}

const KEY = "gh-feed-v1";
const TTL = 5 * 60 * 1000;

export async function fetchFeed(limit = 24): Promise<GhEvent[]> {
  try {
    const cached = sessionStorage.getItem(KEY);
    if (cached) {
      const { at, events } = JSON.parse(cached) as { at: number; events: GhEvent[] };
      if (Date.now() - at < TTL) return events.slice(0, limit);
    }
  } catch {
    /* storage unavailable */
  }

  const results = await Promise.allSettled(
    GITHUB_ACCOUNTS.map((u) =>
      fetch(`https://api.github.com/users/${u}/events/public?per_page=30`, {
        headers: { Accept: "application/vnd.github+json" },
      }).then((r) => (r.ok ? (r.json() as Promise<RawEvent[]>) : Promise.reject(r.status)))
    )
  );

  const events: GhEvent[] = results
    .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
    .map((e) => ({ id: e.id, type: e.type, repo: e.repo.name, at: e.created_at, detail: describe(e) }))
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, limit);

  try {
    if (events.length) sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now(), events }));
  } catch {
    /* ignore */
  }
  return events;
}

export function useGithubFeed(limit = 24) {
  const [events, setEvents] = useState<GhEvent[] | null>(null); // null = loading
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    fetchFeed(limit)
      .then((ev) => alive && (ev.length ? setEvents(ev) : setError(true)))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [limit]);
  return { events, error };
}

// relative time, terse: "3h", "2d", "5w"
export function ago(iso: string, now = Date.now()): string {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 86400 * 14) return `${Math.floor(s / 86400)}d`;
  return `${Math.floor(s / (86400 * 7))}w`;
}
