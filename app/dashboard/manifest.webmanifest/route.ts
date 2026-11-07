import type { MetadataRoute } from "next";
import { brand } from "@/lib/brand";

export function GET() {
  const manifest: MetadataRoute.Manifest = {
    id: "/dashboard",
    name: `${brand.name} · Gestión`,
    short_name: `${brand.shortName} Gestión`,
    description: `Panel de gestión de ${brand.name}. Requiere iniciar sesión.`,
    lang: "es-PE",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#F5F3EE",
    theme_color: "#1A1A1A",
    related_applications: [{ platform: "webapp", url: "/dashboard/manifest.webmanifest", id: "/dashboard" }],
    icons: [
      { src: "/system-icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/system-icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/system-icons/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
  return Response.json(manifest, { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=3600" } });
}
