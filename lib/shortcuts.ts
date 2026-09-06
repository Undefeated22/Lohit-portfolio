"use client";

// Single-character shortcuts (K, S, /) can be switched off — WCAG 2.1.4.
const KEY = "shortcuts-off";
export const shortcutsEnabled = () => {
  try { return localStorage.getItem(KEY) !== "1"; } catch { return true; }
};
export const setShortcutsEnabled = (on: boolean) => {
  try { localStorage.setItem(KEY, on ? "0" : "1"); } catch { /* ignore */ }
};
/** true when a key event should NOT trigger a single-key shortcut */
export function typingTarget(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null;
  return !!t?.closest?.("input, textarea, select, [contenteditable], dialog");
}
