"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { brandLogoUrl } from "@/lib/brand-assets";
import { brand } from "@/lib/brand";

/**
 * Muestra el logo que el negocio subió en «Mi marca». Mientras carga, o si no
 * hay logo, muestra el ícono de siempre (fallback), sin parpadeos de imagen rota.
 */
export default function BrandLogo({ fallback, className = "", imgClassName = "" }: { fallback: ReactNode; className?: string; imgClassName?: string }) {
  const src = brandLogoUrl();
  const imgRef = useRef<HTMLImageElement>(null);
  const [state, setState] = useState<"loading" | "ok" | "none">(src ? "loading" : "none");

  // La imagen puede terminar de cargar antes de que React conecte onLoad/onError
  // (llega en el HTML del servidor): se revisa su estado al montar.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete) setState(img.naturalWidth > 0 ? "ok" : "none");
  }, []);

  return (
    <span className={className}>
      {state !== "ok" && fallback}
      {src && state !== "none" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img ref={imgRef} src={src} alt={`Logo de ${brand.name}`} className={imgClassName} hidden={state !== "ok"}
          onLoad={() => setState("ok")} onError={() => setState("none")} />
      )}
    </span>
  );
}
