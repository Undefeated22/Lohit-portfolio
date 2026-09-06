import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid-bg flex min-h-svh flex-col items-start justify-center px-5 md:px-8">
      <p className="type-label mb-6 flex items-center gap-3">
        <span className="stamp">FAULT</span> NO SUCH ROUTE — 404
      </p>
      <h1 className="type-display text-[clamp(2.75rem,8vw,7rem)]">
        NOTHING AT<br />THIS ADDRESS.
      </h1>
      <p className="mt-8 max-w-[64ch] text-text-2">
        The event log has no record of this path ever existing. Replay from the beginning.
      </p>
      <Link href="/" className="btn btn-stamp mt-10">RETURN TO SHEET 01 ↖</Link>
    </main>
  );
}
