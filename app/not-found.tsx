import Link from "next/link";

// system-voice 404 — even the dead ends stay in character
export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-start justify-center px-5 md:px-10">
      <p className="type-label mb-6 flex items-center gap-2">
        <span className="size-1.5 rounded-full bg-ember" />
        SIGNAL LOST — ERROR 404
      </p>
      <h1 className="type-display text-[clamp(3rem,12vw,10rem)]">
        NOTHING
        <br />
        <span className="type-outline">AT THIS</span>
        <br />
        ADDRESS.
      </h1>
      <p className="mt-8 max-w-md text-fg-dim">
        This route doesn&apos;t exist in the system. The event log shows no
        record of it ever existing.
      </p>
      <Link
        href="/"
        className="mt-10 rounded-full bg-fg px-7 py-3.5 font-mono text-[12px] tracking-[0.12em] text-bg transition-colors duration-300 hover:bg-ember"
      >
        RETURN TO CORE ↖
      </Link>
    </main>
  );
}
