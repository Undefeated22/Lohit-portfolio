"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import { useDecode } from "@/lib/motion";

export default function Decode({ text, className, as: Tag = "span" }: { text: string; className?: string; as?: "span" | "h1" | "h2" | "h3" }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const out = useDecode(text, inView);
  return (
    <Tag ref={ref as never} className={className} aria-label={text}>
      <span aria-hidden>{out}</span>
    </Tag>
  );
}
