"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { commands, search, type Command } from "@/lib/commands";

// ⌘K on a native <dialog>: top layer, Escape, backdrop and focus containment
// for free; APG combobox semantics inside. Zero dependencies.
export default function Palette() {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [result, setResult] = useState("");

  const items = useMemo(() => (q ? search(q, 14) : commands.slice(0, 14)), [q]);

  const open = () => {
    if (!dialog.current || dialog.current.open) return;
    setQ(""); setActive(0); setResult("");
    dialog.current.showModal();
    requestAnimationFrame(() => input.current?.focus());
  };
  const close = () => dialog.current?.close();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        dialog.current?.open ? close() : open();
      }
    };
    const onEmit = () => open();
    window.addEventListener("keydown", onKey);
    window.addEventListener("lohit:palette", onEmit);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("lohit:palette", onEmit);
    };
  }, []);

  const run = (cmd: Command) => {
    const out = cmd.run();
    if (typeof out === "string") {
      setResult(out);
      setTimeout(close, 900);
    } else close();
  };

  const groups = useMemo(() => {
    const m = new Map<string, Command[]>();
    items.forEach((c) => m.set(c.group, [...(m.get(c.group) ?? []), c]));
    return [...m.entries()];
  }, [items]);

  return (
    <dialog
      ref={dialog}
      data-ui
      onClick={(e) => e.target === dialog.current && close()}
      className="m-auto w-[min(92vw,640px)] bg-bg p-0 text-text shadow-hard-chalk backdrop:bg-bg-deep/70 backdrop:backdrop-blur-sm open:animate-[pal-in_.25s_var(--ease-out-expo)]"
      aria-label="Command palette"
    >
      <style>{`@keyframes pal-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
      <div className="rule-chalk">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <span className="type-label text-accent">›</span>
          <input
            ref={input}
            role="combobox"
            aria-expanded
            aria-controls="pal-list"
            aria-activedescendant={items[active] ? `pal-${items[active].id}` : undefined}
            aria-autocomplete="list"
            aria-label="Command"
            value={q}
            onChange={(e) => { setQ(e.target.value); setActive(0); }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
              else if (e.key === "Home") { e.preventDefault(); setActive(0); }
              else if (e.key === "End") { e.preventDefault(); setActive(items.length - 1); }
              else if (e.key === "Enter" && items[active]) { e.preventDefault(); run(items[active]); }
            }}
            placeholder="go to · open · kill · shrink · seed …"
            autoComplete="off"
            spellCheck={false}
            className="h-12 w-full bg-transparent font-mono text-sm text-text outline-none placeholder:text-label"
          />
          <kbd className="type-label">esc</kbd>
        </div>
        <ul id="pal-list" role="listbox" className="max-h-[50vh] overflow-y-auto py-2">
          {groups.map(([group, cmds]) => (
            <li key={group} role="presentation">
              <div className="type-label px-4 pb-1 pt-3">{group}</div>
              <ul role="group" aria-label={group}>
                {cmds.map((c) => {
                  const i = items.indexOf(c);
                  return (
                    <li
                      key={c.id}
                      id={`pal-${c.id}`}
                      role="option"
                      aria-selected={i === active}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => run(c)}
                      className={`flex cursor-pointer items-center justify-between px-4 py-2 font-mono text-sm ${
                        i === active ? "bg-accent text-bg" : "text-text-2"
                      }`}
                    >
                      <span>{c.label}</span>
                      {c.shortcut && <kbd className={`type-label ${i === active ? "text-bg" : ""}`}>{c.shortcut}</kbd>}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
          {!items.length && <li className="px-4 py-3 text-sm text-label">no command matches “{q}”</li>}
        </ul>
        <div role="status" className="type-label border-t border-line px-4 py-2 text-accent">
          {result || `${items.length} commands`}
        </div>
      </div>
    </dialog>
  );
}
