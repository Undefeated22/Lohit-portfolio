import type { MetadataRoute } from "next";
import { meta } from "@/data/portfolio";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${meta.url}/sitemap.xml`,
  };
}
