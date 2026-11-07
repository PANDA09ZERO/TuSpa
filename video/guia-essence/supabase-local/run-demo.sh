#!/usr/bin/env bash
# Arranca la app como "tuSpa" contra el Supabase LOCAL (las variables del proceso ganan a .env).
HERE="$(cd "$(dirname "$0")" && pwd)"
set -a; . "$HERE/.env.demo"; set +a
case "$NEXT_PUBLIC_SUPABASE_URL" in http://127.0.0.1:*|http://localhost:*) ;; *) echo "La demo debe usar Supabase local"; exit 1;; esac
cd "$HERE/../../.." && exec npx next dev -p "${PORT:-3100}"
