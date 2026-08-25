import type { MetadataRoute } from "next";
import { meta } from "@/data/portfolio";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: meta.url, lastModified: new Date(), priority: 1 }];
}
