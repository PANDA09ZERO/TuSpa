import { NextRequest, NextResponse } from "next/server";
import { requireEmployeeRequest } from "@/lib/employee-api-auth";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  BRAND_BUCKET, BRAND_GALLERY_MAX, BRAND_IMAGE_MAX_BYTES, BRAND_IMAGE_TYPES,
  getBrandAssets, isBrandPath,
} from "@/lib/brand-assets";

const ADMIN_ONLY = { roles: ["admin"], message: "Solo un administrador puede cambiar las fotos de la marca" };
const EXTENSIONS: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

/** Fotos actuales de la marca (para la página «Mi marca»). */
export async function GET(request: NextRequest) {
  const session = await requireEmployeeRequest(request, ADMIN_ONLY);
  if ("error" in session) return session.error;
  const assets = await getBrandAssets(createSupabaseAdminClient());
  return NextResponse.json({ data: assets }, { headers: { "Cache-Control": "no-store" } });
}

/** Sube el logo, la portada o una foto de la galería. Cuerpo: multipart con "tipo" y "archivo". */
export async function POST(request: NextRequest) {
  const session = await requireEmployeeRequest(request, ADMIN_ONLY);
  if ("error" in session) return session.error;

  let form: FormData;
  try { form = await request.formData(); } catch { return NextResponse.json({ error: "Envía la imagen como formulario" }, { status: 400 }); }
  const tipo = form.get("tipo");
  const archivo = form.get("archivo");
  if (tipo !== "logo" && tipo !== "portada" && tipo !== "galeria") {
    return NextResponse.json({ error: "Indica si es el logo, la portada o una foto de la galería" }, { status: 400 });
  }
  if (!(archivo instanceof File) || archivo.size === 0) return NextResponse.json({ error: "Selecciona una imagen" }, { status: 400 });
  if (!BRAND_IMAGE_TYPES.includes(archivo.type)) return NextResponse.json({ error: "La imagen debe ser PNG, JPG o WebP" }, { status: 400 });
  if (archivo.size > BRAND_IMAGE_MAX_BYTES) return NextResponse.json({ error: "La imagen debe pesar menos de 5 MB" }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const storage = supabase.storage.from(BRAND_BUCKET);
  let path: string = tipo;
  if (tipo === "galeria") {
    const actuales = await getBrandAssets(supabase);
    if (actuales.galeria.length >= BRAND_GALLERY_MAX) {
      return NextResponse.json({ error: `La galería admite hasta ${BRAND_GALLERY_MAX} fotos. Borra una para subir otra.` }, { status: 409 });
    }
    path = `galeria/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${EXTENSIONS[archivo.type]}`;
  }

  const { error } = await storage.upload(path, archivo, { contentType: archivo.type, upsert: tipo !== "galeria", cacheControl: "60" });
  if (error) {
    const sinBucket = /bucket/i.test(error.message);
    return NextResponse.json({ error: sinBucket ? "Falta aplicar config/migration-storage-marca.sql en la base de datos" : error.message }, { status: sinBucket ? 500 : 400 });
  }
  return NextResponse.json({ data: await getBrandAssets(supabase) });
}

/** Borra una foto. Cuerpo JSON: { "path": "logo" | "portada" | "galeria/<archivo>" }. */
export async function DELETE(request: NextRequest) {
  const session = await requireEmployeeRequest(request, ADMIN_ONLY);
  if ("error" in session) return session.error;
  let body: { path?: unknown } | null = null;
  try { body = await request.json(); } catch { /* cuerpo inválido */ }
  if (!body || !isBrandPath(body.path)) return NextResponse.json({ error: "Foto no válida" }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage.from(BRAND_BUCKET).remove([body.path]);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data: await getBrandAssets(supabase) });
}
