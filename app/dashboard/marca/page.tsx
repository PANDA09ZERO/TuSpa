"use client";

import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { ArrowUpRight, ImagePlus, Trash2, Upload } from "lucide-react";
import { useSupabase } from "@/components/layout/SupabaseProvider";
import { apiFetch } from "@/lib/api-fetch";
import { brand } from "@/lib/brand";
import { BRAND_GALLERY_MAX, BRAND_IMAGE_MAX_BYTES, BRAND_IMAGE_TYPES, EMPTY_BRAND_ASSETS, type BrandAssets } from "@/lib/brand-assets";

type Tipo = "logo" | "portada" | "galeria";

export default function MarcaPage() {
  const { user } = useSupabase();
  const isAdmin = user?.role === "admin";
  const [assets, setAssets] = useState<BrandAssets>(EMPTY_BRAND_ASSETS);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await apiFetch("/api/marca", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudieron cargar las fotos");
      setAssets(result.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar las fotos");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (isAdmin) void load(); }, [isAdmin, load]);

  const subir = async (tipo: Tipo, event: ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0];
    event.target.value = "";
    if (!archivo) return;
    setError(""); setMessage("");
    if (!BRAND_IMAGE_TYPES.includes(archivo.type)) { setError("La imagen debe ser PNG, JPG o WebP."); return; }
    if (archivo.size > BRAND_IMAGE_MAX_BYTES) { setError("La imagen debe pesar menos de 5 MB."); return; }
    setBusy(tipo);
    try {
      const form = new FormData();
      form.append("tipo", tipo); form.append("archivo", archivo);
      const response = await apiFetch("/api/marca", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo subir la imagen");
      setAssets(result.data);
      setMessage(tipo === "logo" ? "Logo actualizado" : tipo === "portada" ? "Portada actualizada" : "Foto agregada a la galería");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir la imagen");
    } finally { setBusy(null); }
  };

  const borrar = async (path: string) => {
    setError(""); setMessage(""); setBusy(path);
    try {
      const response = await apiFetch("/api/marca", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo borrar la imagen");
      setAssets(result.data);
      setMessage("Imagen borrada");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo borrar la imagen");
    } finally { setBusy(null); }
  };

  if (user && !isAdmin) {
    return <div className="bento-card text-sm text-red-600">Solo el Administrador puede cambiar las fotos de la marca.</div>;
  }

  const uploadButton = (tipo: Tipo, label: string, disabled = false) => (
    <label className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium hover:bg-stone-50 ${disabled || busy ? "pointer-events-none opacity-50" : ""}`}>
      <Upload size={16} aria-hidden="true" />{busy === tipo ? "Subiendo…" : label}
      <input id={`marca-${tipo}`} type="file" accept={BRAND_IMAGE_TYPES.join(",")} className="sr-only" disabled={disabled || !!busy} onChange={(event) => void subir(tipo, event)} />
    </label>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-green">Mi marca</h1>
          <p className="mt-1 text-brand-text-light">El logo y las fotos que ven tus clientas en la página de {brand.name}.</p>
        </div>
        <a href="/" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-green px-5 py-3 text-sm font-medium text-white">Ver página pública <ArrowUpRight size={16} /></a>
      </div>

      {error && <div role="alert" className="bento-card text-sm text-red-600">{error}</div>}
      {message && <div role="status" className="bento-card text-sm text-brand-green">{message}</div>}
      {loading && <div role="status" className="bento-card text-sm text-brand-text-light">Cargando fotos…</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="marca-logo-title" className="bento-card space-y-4">
          <div>
            <h2 id="marca-logo-title" className="font-display text-lg font-bold">Logo</h2>
            <p className="text-sm text-brand-text-light">Aparece en tu página, en el inicio de sesión y en el panel. Mejor cuadrado y con fondo transparente (PNG).</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-stone-200 bg-stone-50">
              {assets.logo ? <img src={assets.logo.url} alt={`Logo de ${brand.name}`} className="h-full w-full object-contain" /> : <ImagePlus className="text-stone-400" aria-hidden="true" />}
            </div>
            <div className="flex flex-wrap gap-2">
              {uploadButton("logo", assets.logo ? "Cambiar logo" : "Subir logo")}
              {assets.logo && <button type="button" onClick={() => void borrar("logo")} disabled={!!busy} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-red-200 px-4 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 size={16} />Quitar</button>}
            </div>
          </div>
        </section>

        <section aria-labelledby="marca-portada-title" className="bento-card space-y-4">
          <div>
            <h2 id="marca-portada-title" className="font-display text-lg font-bold">Portada</h2>
            <p className="text-sm text-brand-text-light">La foto grande del inicio de tu página. Mejor horizontal, de tu local o de un servicio.</p>
          </div>
          <div className="aspect-[16/7] max-w-full overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
            {assets.portada ? <img src={assets.portada.url} alt="Portada actual" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-stone-500">Sin portada: se usa un fondo neutro</div>}
          </div>
          <div className="flex flex-wrap gap-2">
            {uploadButton("portada", assets.portada ? "Cambiar portada" : "Subir portada")}
            {assets.portada && <button type="button" onClick={() => void borrar("portada")} disabled={!!busy} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-red-200 px-4 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 size={16} />Quitar</button>}
          </div>
        </section>
      </div>

      <section aria-labelledby="marca-galeria-title" className="bento-card space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="marca-galeria-title" className="font-display text-lg font-bold">Galería del local</h2>
            <p className="text-sm text-brand-text-light">Hasta {BRAND_GALLERY_MAX} fotos para la sección «Un espacio para sentirte bien». Llevas {assets.galeria.length}.</p>
          </div>
          {uploadButton("galeria", "Agregar foto", assets.galeria.length >= BRAND_GALLERY_MAX)}
        </div>
        {assets.galeria.length ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {assets.galeria.map((foto, index) => (
              <li key={foto.path} className="group relative aspect-square overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
                <img src={foto.url} alt={`Foto ${index + 1} del local`} className="h-full w-full object-cover" />
                <button type="button" onClick={() => void borrar(foto.path)} disabled={!!busy} aria-label={`Borrar foto ${index + 1}`} className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-red-600 shadow disabled:opacity-50"><Trash2 size={16} /></button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl bg-stone-50 p-6 text-center text-sm text-stone-500">Aún no hay fotos. Mientras tanto, la página muestra ilustraciones neutras.</p>
        )}
      </section>
    </div>
  );
}
