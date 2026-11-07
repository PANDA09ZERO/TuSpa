#!/usr/bin/env bash
# Aplica el esquema de config/ y los datos ficticios en la base LOCAL de demo (contenedor Docker).
# No se conecta a ninguna base remota.
set -u
DB=supabase_db_guia-spa-demo
CONFIG="$(cd "$(dirname "$0")/../../../config" && pwd)"
HERE="$(cd "$(dirname "$0")" && pwd)"

run() {
  echo "== $1"
  docker exec -i "$DB" psql -v ON_ERROR_STOP=0 -q -U postgres -d postgres < "$2" 2>&1 | grep -v "already exists\|NOTICE" || true
}

# Orden de aplicación (migration-categorias-rls.sql está marcada como obsoleta: no se aplica).
run "database.sql" "$CONFIG/database.sql"
for f in migration-servicios-imagen migration-empleados-password-hash migration-empleados-auth-user \
         migration-storage-servicios migration-caja migration-caja-permisos migration-citas-invitado \
         migration-cierre-caja migration-performance-indexes migration-rls-hardening migration-storage-marca; do
  run "$f.sql" "$CONFIG/$f.sql"
done
# database.sql trae servicios de ejemplo (con erratas como "Peluado"); se quitan para la demo.
docker exec "$DB" psql -q -U postgres -d postgres -c "DELETE FROM servicios WHERE categoria IN ('Cabello','Spa','Uñas'); DELETE FROM categorias WHERE nombre IN ('Cabello','Spa','Uñas');"
run "seed-demo.sql" "$HERE/seed-demo.sql"
docker exec "$DB" psql -U postgres -d postgres -c "NOTIFY pgrst, 'reload schema';" >/dev/null
