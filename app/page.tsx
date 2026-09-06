import dynamic from "next/dynamic";
import Providers from "@/components/Providers";
import Boot from "@/components/Boot";
import Nav from "@/components/Nav";
import HUD from "@/components/HUD";
import Palette from "@/components/Palette";
import Terminal from "@/components/Terminal";
import SmoothScroll from "@/components/SmoothScroll";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Work from "@/components/sections/Work";
import Lab from "@/components/sections/Lab";
import Journey from "@/components/sections/Journey";
import Contact from "@/components/sections/Contact";

// The drawing is client-only and heavy — never in the first paint's way.
const Scene = dynamic(() => import("@/components/three/Scene"));

// Six sheets, six phases of one deterministic run:
// BOOT → LEASE ACQUIRE → WORKFLOWS → FAULT INJECTION → SHRINK → EXIT 0
export default function Home() {
  return (
    <Providers>
      <Boot />
      <SmoothScroll />
      <Scene />
      <Nav />
      <HUD />
      <Palette />
      <Terminal />
      <main id="main" tabIndex={-1} className="relative z-10 outline-none">
        <Hero />
        <About />
        <Work />
        <Lab />
        <Journey />
        <Contact />
      </main>
    </Providers>
  );
}
