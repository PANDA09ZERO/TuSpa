// Marca configurable (marca blanca). Cada instalación de tuSpa define el nombre
// y los datos de contacto de su negocio con variables de entorno NEXT_PUBLIC_BRAND_*.
// El logo, la portada y la galería se suben desde el panel (Administración → Mi marca).
// Sin variables, el sistema se muestra como la demo de «tuSpa» con datos de ejemplo.

function env(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

const name = env(process.env.NEXT_PUBLIC_BRAND_NAME, "tuSpa");

export const brand = {
  /** Nombre completo del negocio, p. ej. "Spa Rosa". */
  name,
  /** Nombre corto para etiquetas como "Agenda Spa Rosa" o "Spa Rosa / Gestión". */
  shortName: env(process.env.NEXT_PUBLIC_BRAND_SHORT_NAME, name),
  /** Número de WhatsApp con código de país, solo dígitos (p. ej. 51987654321). */
  whatsapp: env(process.env.NEXT_PUBLIC_BRAND_WHATSAPP, "51900000000").replace(/\D/g, ""),
  mapsUrl: env(process.env.NEXT_PUBLIC_BRAND_MAPS_URL, "https://maps.google.com/?q=Lima,Peru"),
  facebookUrl: env(process.env.NEXT_PUBLIC_BRAND_FACEBOOK_URL, "https://www.facebook.com/"),
  instagramUrl: env(process.env.NEXT_PUBLIC_BRAND_INSTAGRAM_URL, "https://www.instagram.com/"),
  /** Ejemplo de email que se muestra en el login. */
  loginEmailPlaceholder: env(process.env.NEXT_PUBLIC_BRAND_LOGIN_PLACEHOLDER, "admin@tuspa.pe"),
};

export function whatsappLink(message?: string) {
  return `https://wa.me/${brand.whatsapp}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}
