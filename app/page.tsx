import dynamic from "next/dynamic";
import Providers from "@/components/Providers";
import Boot from "@/components/Boot";
import Nav from "@/components/Nav";
import Cursor from "@/components/Cursor";
import SmoothScroll from "@/components/SmoothScroll";
import Hero from "@/components/sections/Hero";
import Work from "@/components/sections/Work";
import About from "@/components/sections/About";
import Lab from "@/components/sections/Lab";
import Stack from "@/components/sections/Stack";
import Journey from "@/components/sections/Journey";
import Contact from "@/components/sections/Contact";

// The 3D world is client-only and heavy — never in the first paint's way.
const Scene = dynamic(() => import("@/components/three/Scene"));

export default function Home() {
  return (
    <Providers>
      <Boot />
      <SmoothScroll />
      <Cursor />
      <Scene />
      <Nav />
      <main id="main" tabIndex={-1} className="relative z-10 outline-none">
        <Hero />
        <Work />
        <About />
        <Lab />
        <Stack />
        <Journey />
        <Contact />
      </main>
    </Providers>
  );
}
