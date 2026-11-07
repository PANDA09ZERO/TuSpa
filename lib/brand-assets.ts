// Fotos de la marca de cada negocio (logo, portada y galería) guardadas en el
// bucket público "marca" de su Supabase. Ver config/migration-storage-marca.sql.
import type { SupabaseClient } from "@supabase/supabase-js";

export const BRAND_BUCKET = "marca";
export const BRAND_GALLERY_MAX = 12;
export const BRAND_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const BRAND_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

export interface BrandImage { path: string; url: string; }
export interface BrandAssets { logo: BrandImage | null; portada: BrandImage | null; galeria: BrandImage[]; }

export const EMPTY_BRAND_ASSETS: BrandAssets = { logo: null, portada: null, galeria: [] };

/** URL pública del logo (sin consultar la base); si no existe, la imagen da error y se usa el ícono. */
export function brandLogoUrl() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base ? `${base}/storage/v1/object/public/${BRAND_BUCKET}/logo` : null;
}

/** Ruta válida de un archivo de la marca: "logo", "portada" o "galeria/<archivo>". */
export function isBrandPath(path: unknown): path is string {
  return typeof path === "string" && (path === "logo" || path === "portada" || /^galeria\/[A-Za-z0-9._-]{1,120}$/.test(path));
}

/**
 * Lee qué fotos tiene subidas el negocio. Si el bucket no existe todavía
 * (migración sin aplicar) devuelve vacío y la página usa sus imágenes por defecto.
 */
export async function getBrandAssets(supabase: SupabaseClient): Promise<BrandAssets> {
  try {
    const storage = supabase.storage.from(BRAND_BUCKET);
    const [root, gallery] = await Promise.all([
      storage.list("", { limit: 20 }),
      storage.list("galeria", { limit: BRAND_GALLERY_MAX, sortBy: { column: "created_at", order: "asc" } }),
    ]);
    if (root.error) return EMPTY_BRAND_ASSETS;
    const toImage = (path: string, version?: string | null): BrandImage => {
      const url = storage.getPublicUrl(path).data.publicUrl;
      return { path, url: version ? `${url}?v=${encodeURIComponent(version)}` : url };
    };
    const file = (name: string) => (root.data || []).find((item) => item.name === name && item.id);
    const logo = file("logo"), portada = file("portada");
    return {
      logo: logo ? toImage("logo", logo.updated_at) : null,
      portada: portada ? toImage("portada", portada.updated_at) : null,
      galeria: (gallery.data || []).filter((item) => item.id && item.name !== ".emptyFolderPlaceholder").map((item) => toImage(`galeria/${item.name}`)),
    };
  } catch {
    return EMPTY_BRAND_ASSETS;
  }
}
