-- ============================================
-- MIGRACIÓN: Fotos de la marca de cada negocio
-- Ejecutar en Supabase (SQL Editor). Se puede ejecutar más de una vez.
--
-- Bucket público "marca" con:
--   logo          → logo del negocio
--   portada       → foto de portada de la página pública
--   galeria/...   → fotos del local (hasta 12)
-- Todos pueden VER las imágenes (la página pública las muestra).
-- Solo el servidor (service role) las sube o borra, después de comprobar
-- que quien lo pide es Administrador (ruta /api/marca).
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('marca', 'marca', TRUE, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Lectura pública de la marca" ON storage.objects;
CREATE POLICY "Lectura pública de la marca"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'marca');
