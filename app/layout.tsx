import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { meta, identity, socials } from "@/data/portfolio";
import "./globals.css";

// JSON-LD Person schema: connects name searches to this site and the
// GitHub/LinkedIn profiles it links out to.
const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: identity.legalName,
  alternateName: identity.name,
  jobTitle: "Backend Engineer",
  url: meta.url,
  email: `mailto:${identity.email}`,
  sameAs: socials.filter((s) => s.href.startsWith("http")).map((s) => s.href),
};

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
};

export const metadata: Metadata = {
  metadataBase: new URL(meta.url),
  title: meta.title,
  description: meta.description,
  openGraph: {
    title: meta.title,
    description: meta.description,
    url: meta.url,
    siteName: identity.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: meta.title,
    description: meta.description,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable} ${plexMono.variable}`}>
      <body className="grain">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
        <a
          href="#main"
          className="fixed left-4 top-4 z-[100] -translate-y-24 rounded bg-fg px-4 py-2 font-mono text-xs text-bg transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
