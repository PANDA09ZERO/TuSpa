# Cuentas de prueba (solo base local de demo)

Estas cuentas existen **solo** en el Supabase local de Docker (`video/guia-essence/supabase-local`, `http://127.0.0.1:54321`). No existen en la base real de Essence.

| Rol | Se muestra como | Email | Nombre |
|---|---|---|---|
| `admin` | Administrador | `admin@demo.local` | Paola Ramírez |
| `recepcionista` | Recepción | `recepcion@demo.local` | Diana Salazar |
| `manicurista` | Especialista | `especialista@demo.local` | Ana Torres |

La contraseña (la misma para las tres) está en `supabase-local/.env.demo` (`DEMO_PASSWORD`). Ese archivo lo ignora git.

## Cómo levantar la demo

```bash
cd video/guia-essence/supabase-local
npx supabase@2 start --workdir . -x studio,realtime,edge-runtime,logflare,vector,imgproxy,supavisor,postgres-meta,mailpit
bash aplicar-esquema.sh          # solo la primera vez (esquema + datos ficticios)
```

Luego arranca la app con las variables de `.env.demo` (marca «tuSpa», contactos y fotos de demo).

Para apagar: `npx supabase@2 stop --workdir .`
