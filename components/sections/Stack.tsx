"use client";

import { stack, projects } from "@/data/portfolio";
import { Reveal } from "../ui/Reveal";
import SectionHeader from "../ui/SectionHeader";

// Tech counts derived from real project data — the ecosystem stays honest.
const usage = new Map<string, number>();
for (const p of projects) for (const t of p.tech) usage.set(t, (usage.get(t) ?? 0) + 1);

export default function Stack() {
  return (
    <section aria-label="Technology stack" className="relative px-5 py-32 md:px-10 md:py-44">
      <div className="mx-auto max-w-[1600px]">
        <SectionHeader
          index="04"
          label="THE ECOSYSTEM — TOOLS I THINK IN"
          right="×N = SHIPPED IN N PROJECTS"
        />

        <div className="grid grid-cols-2 gap-x-8 gap-y-14 md:grid-cols-3 lg:grid-cols-6">
          {stack.map((group, gi) => (
            <Reveal key={group.group} delay={gi * 0.06}>
              <h3 className="type-label border-b border-line pb-3 text-ember">
                {group.group}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {group.items.map((item) => {
                  const count = usage.get(item);
                  return (
                    <li key={item} className="flex items-baseline justify-between gap-3">
                      {/* shipped-in-a-project techs read brighter — claims vs proof */}
                      <span className={`text-sm ${count ? "text-fg" : "text-fg-dim"}`}>
                        {item}
                      </span>
                      {count && (
                        <span
                          className="type-index shrink-0 text-[10px] text-ember"
                          aria-label={`used in ${count} project${count > 1 ? "s" : ""}`}
                        >
                          ×{count}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
