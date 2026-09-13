import type { MetadataRoute } from "next";
import type { EventDTO } from "@/types";
import { apiGet } from "@/lib/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const staticRoutes: MetadataRoute.Sitemap = ["", "/events", "/help"].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "daily",
    priority: path === "" ? 1 : 0.7,
  }));

  let eventRoutes: MetadataRoute.Sitemap = [];
  try {
    const { data } = await apiGet<EventDTO[]>("/events?limit=50&sort=newest", { auth: false });
    eventRoutes = data.map((event) => ({
      url: `${base}/events/${event.slug}`,
      lastModified: event.publishedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  } catch {
    eventRoutes = [];
  }

  return [...staticRoutes, ...eventRoutes];
}
