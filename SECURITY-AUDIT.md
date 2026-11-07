# Auditoría de seguridad — Essence Spa (Next.js 15 + Supabase)

Fecha: 2026-11-05 · Alcance: repositorio completo (`main` @ `bc899f2`), análisis estático + `npm audit` + revisión del historial git.

> **Limitación importante:** el estado de RLS se dedujo de los SQL en `config/`. No se consultó la base de datos en producción. Antes de priorizar, ejecuta en el SQL Editor de Supabase:
>
> ```sql
> select tablename, policyname, cmd, roles, qual, with_check
> from pg_policies where schemaname in ('public','storage') order by tablename, cmd;
> select relname, relrowsecurity from pg_class
> where relnamespace = 'public'::regnamespace and relkind = 'r';
> ```
>
> Si el resultado coincide con `config/database.sql`, los hallazgos C-01 y C-02 se pueden explotar hoy con la anon key que viaja en el bundle del navegador.

---

## 1. Resumen ejecutivo

| Severidad | Nº |
|---|---|
| Crítica | 2 |
| Alta | 3 |
| Media | 7 |
| Baja | 8 |
| **Total** | **20** |

El modelo de seguridad tiene **dos mitades que no encajan**:

- **Dinero (bien hecho):** `pagos`, `pago_adicionales`, `movimientos_caja` y `cierres_caja` están cerradas para anon/authenticated, `cobrar_cita` solo puede ejecutarla `service_role`, y `/api/caja*` validan token y rol antes de usar el service role. La protección contra el doble cobro es correcta.
- **Todo lo demás (roto):** `empleados`, `clientes`, `citas`, `servicios`, `promociones`, `configuracion` y `cita_detalles` tienen políticas `USING (true)` / `WITH CHECK (true)` para **cualquier rol, incluido `anon`**. La tabla que decide quién es admin (`empleados`) es **escribible por cualquiera** con la anon key pública. Así, la protección de la caja también cae: un atacante se inserta como admin y luego usa las rutas de caja legítimamente.

Además, la mayoría de las rutas `app/api/*` (citas, clientes, servicios, promociones, categorías, `GET /api/empleados`) **no exigen sesión**. `categorias` incluso usa el service role sin autenticación.

---

## 2. Tabla de hallazgos

### C-01 — Crítica — Escalada a administrador vía RLS de `empleados`

- **Archivo:** `config/database.sql:201-205`; consumido en `lib/employee-api-auth.ts:36-40`
- **Descripción:** `empleados` tiene `SELECT/INSERT/UPDATE/DELETE USING (true)` sin cláusula `TO`, así que aplica a `anon`. La autorización de todas las rutas protegidas (`resolveEmployee`) se basa en buscar el email del usuario en `empleados` y leer `rol`. Cualquiera puede crear su propia fila con `rol='admin'`, cambiar el rol o el email de un empleado existente, o borrar a todo el equipo.
- **PoC** (anon key y URL se obtienen del JS del sitio):
  ```bash
  # 1) Crear cuenta propia (signup público de Supabase o /api/auth/register)
  curl -X POST "$SB_URL/auth/v1/signup" -H "apikey: $ANON" -H "Content-Type: application/json" \
    -d '{"email":"atacante@mail.com","password":"Passw0rd!x"}'
  # 2) Auto-asignarse admin
  curl -X POST "$SB_URL/rest/v1/empleados" -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
    -H "Content-Type: application/json" \
    -d '{"nombre":"x","apellido":"x","email":"atacante@mail.com","rol":"admin"}'
  # 3) Login → Bearer token → acceso total a /api/caja, /api/caja/cierre, /api/empleados (crea/borra cuentas Auth con service role)
  # Variante sin signup: degradar o secuestrar a un admin real
  curl -X PATCH "$SB_URL/rest/v1/empleados?rol=eq.admin" -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
    -H "Content-Type: application/json" -d '{"rol":"manicurista"}'
  ```
- **Mitigación:**
  ```sql
  drop policy "Todos pueden insertar empleados" on empleados;
  drop policy "Todos pueden actualizar empleados" on empleados;
  drop policy "Todos pueden eliminar empleados" on empleados;
  drop policy "Todos pueden ver empleados" on empleados;
  revoke insert, update, delete on empleados from anon, authenticated;
  -- Lectura: solo la propia fila (el cliente la usa para conocer su rol)
  create policy empleados_self_read on empleados for select to authenticated
    using (auth_user_id = auth.uid());
  -- No exponer password_hash ni siquiera a la propia fila
  revoke select (password_hash) on empleados from anon, authenticated;
  ```
  En `lib/employee-api-auth.ts` busca por `auth_user_id = user.id` (ver M-01) y usa el cliente admin para esa lectura. Toda escritura en `empleados` debe pasar por `/api/empleados` (que ya exige admin).

### C-02 — Crítica — Lectura y escritura anónima de clientes, citas, servicios, promociones y configuración

- **Archivo:** `config/database.sql:106-108, 183-187, 210-241`; `config/migration-categorias-rls.sql:20-23`
- **Descripción:** políticas `USING (true)` para todos los roles. Con la anon key:
  - **Fuga de datos personales:** `clientes` (nombre, email, teléfono, dirección, fecha de nacimiento) y `citas` (`telefono_invitado`, notas).
  - **Integridad/fraude:** modificar `citas.total` antes del cobro (`cobrar_cita` toma el importe de `citas.total`, `database.sql:332`), cambiar `servicios.precio`, crear una promoción del 100 %, o borrar en masa citas y clientes (`ON DELETE CASCADE` en `citas.id_cliente` borra el historial).
- **PoC:**
  ```bash
  curl "$SB_URL/rest/v1/clientes?select=*" -H "apikey: $ANON"                       # volcado PII
  curl -X PATCH "$SB_URL/rest/v1/citas?id=eq.<uuid>" -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
    -H "Content-Type: application/json" -d '{"total":0.01}'                          # se cobra 0.01
  curl -X DELETE "$SB_URL/rest/v1/clientes?id=not.is.null" -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
  ```
- **Mitigación:** aplica el mismo patrón que ya usas en caja: `revoke all ... from anon, authenticated` y que solo las rutas `/api` (con `requireEmployeeRequest` + service role) accedan. Si el catálogo público necesita leer `servicios`, `categorias` y `promociones`, deja solo `SELECT` para `anon`, filtrado (`using (estado = 'activo')` / `using (activa)`), y sin políticas de escritura. `clientes`, `citas`, `cita_detalles` y `configuracion` no deben tener ninguna política para `anon`.

### A-01 — Alta — Rutas API sin autenticación (y una con service role)

- **Archivos:**
  - `app/api/categorias/route.ts:7-20`, `app/api/categorias/[id]/route.ts:6-108`: **service role sin ninguna verificación de sesión**. Cualquiera puede crear, renombrar o borrar categorías. Además, el renombrado modifica `servicios.categoria` en masa. Esto seguirá abierto aunque arregles el RLS.
  - `app/api/citas/route.ts:9-76`, `app/api/citas/[id]/route.ts:10-177`, `app/api/citas/[id]/convertir/route.ts:11`, `app/api/citas/opciones/route.ts:6`
  - `app/api/clientes/route.ts:6-17`, `app/api/servicios/route.ts:6-17`, `app/api/servicios/[id]/route.ts:6-19`
  - `app/api/promociones/route.ts:6-17` (además `descuento` sin límites, a diferencia del PATCH), `app/api/promociones/[id]/route.ts:6`
  - `app/api/empleados/route.ts:16-20`: `GET` público con email, teléfono y rol de todo el equipo, lo que facilita phishing y ataques de credenciales contra los admins.
  - El frontend tampoco envía token a estas rutas (p. ej. `app/dashboard/clientes/page.tsx:16`, `app/dashboard/servicios/page.tsx:64-65`).
- **PoC:**
  ```bash
  curl https://<app>/api/clientes                                                   # PII sin login
  curl https://<app>/api/empleados                                                  # emails/roles del equipo
  curl -X DELETE https://<app>/api/categorias/<uuid>                                # borrado con service role
  curl -X POST https://<app>/api/promociones -H "Content-Type: application/json" \
    -d '{"nombre":"x","descuento":100,"activa":true}'
  ```
- **Mitigación:** añade `requireEmployeeRequest(request, { roles: [...] })` al inicio de cada handler (lectura: cualquier empleado; escritura de catálogo y promociones: `admin`; citas: `admin`/`recepcionista`). Una vez autenticadas, cámbialas al cliente admin para que funcionen con el RLS cerrado de C-02. En el frontend, centraliza un `apiFetch` que adjunte `Authorization: Bearer <access_token>`.

### A-02 — Alta — Clave `service_role` en refs git locales y artefactos de build

- **Archivos:** commits `fb48a88`, `e4f8bf7`, `7faa658`, `27c5511`, `4a22023` (refs `cline/checkpoints/*` y `agents/*/checkpoints/*`) añaden `.env` y `.next/standalone/.env`. La clave aparece también en `.next/required-server-files.json` y en `.next/standalone/.env` (en disco).
- **Verificado:** `git ls-remote origin` solo publica `refs/heads/main`, y esos commits **no** forman parte de `origin/main`. La clave **no está en GitHub**. Sí quedó escrita en el historial de herramientas locales (Cline / sesiones de agente) y en copias de la carpeta.
- **PoC:** `git log --all -S "SUPABASE_SERVICE_ROLE_KEY=eyJ" --name-status` → muestra los commits. Con un `git push --all` o `--mirror` accidental, la clave se publicaría.
- **Mitigación:** rota la clave service role en Supabase (Settings → API; idealmente migra a las nuevas *secret keys*, que se pueden revocar por separado) y actualízala en Vercel. Después borra las refs: `git for-each-ref --format='%(refname)' refs/heads/cline refs/heads/agents | xargs -n1 git update-ref -d`, y luego `git reflog expire --expire=now --all && git gc --prune=now`. No copies `.next/standalone` fuera de la máquina.

### A-03 — Alta — Credenciales en la tabla `empleados` legibles públicamente

- **Archivo:** `config/database.sql:33, 202, 389-392`
- **Descripción:** `password_hash` se puede leer con `SELECT USING (true)`. El seed inserta al admin con la contraseña **en texto plano** `admin123` en esa columna. La columna no se usa en el código (`lib/password.ts` no tiene llamadores), pero si el seed se ejecutó, el valor está expuesto. Si esa misma contraseña se reutilizó para la cuenta Supabase Auth de `admin@essencespa.pe`, el login como admin es inmediato.
- **PoC:** `curl "$SB_URL/rest/v1/empleados?select=email,password_hash" -H "apikey: $ANON"`
- **Mitigación:** `update empleados set password_hash = null;` y luego `alter table empleados drop column password_hash;`. Elimina el `INSERT` del seed (líneas 389-392). Verifica que ninguna cuenta Auth use `admin123`.

### M-01 — Media — Identificación de empleados por `ILIKE` sobre el email (comodines)

- **Archivos:** `lib/employee-api-auth.ts:39`, `app/api/reportes/route.ts:61`, `components/layout/SupabaseProvider.tsx:91`, `app/api/empleados/route.ts:57`
- **Descripción:** `.ilike("email", user.email)` interpreta `_` y `%` del email del usuario como comodines. Un email Auth como `adm_n@essencespa.pe` coincide con `admin@essencespa.pe`. La explotación real depende de que el atacante pueda tener una sesión con ese email, es decir, de que la confirmación de email esté desactivada en Supabase Auth o de que controle el dominio. Además, la columna `auth_user_id` ya existe y es el vínculo correcto, pero no se usa para autorizar.
- **PoC:** con *Confirm email* desactivado: signup `adm_n@essencespa.pe` → `GET /api/caja` con su token → se resuelve como el admin.
- **Mitigación:** `.eq("auth_user_id", user.id)` (con un fallback `.eq("email", user.email.toLowerCase())` solo para cuentas antiguas sin vincular, y vincúlalas con un script). Mantén activada la confirmación de email.

### M-02 — Media — Registro público y rol en `user_metadata` controlado por el usuario

- **Archivos:** `app/api/auth/register/route.ts:10-18`, `components/layout/SupabaseProvider.tsx:58, 92`
- **Descripción:** `/api/auth/register` permite a cualquiera crear una cuenta y elegir `role` en los metadatos (`rol || "cliente"`). Cualquier usuario puede cambiarlo después con `supabase.auth.updateUser({ data: { role: "admin" } })`. **El servidor no confía en ese valor** (bien hecho: `employee-api-auth` usa la tabla). El cliente sí: el rol inicial sale de los metadatos, y si el usuario no está en `empleados` se conserva el de los metadatos (`if (!data?.rol) return;`). Un no-empleado ve la interfaz de admin y las llamadas protegidas le devuelven 403. Lo más grave es que el registro abierto le da el rol `authenticated`, necesario para M-03.
- **Mitigación:** elimina `/api/auth/register` y desactiva *Allow new users to sign up* en Supabase Auth (los empleados se crean desde `/api/empleados` con `admin.createUser`). En el provider, usa `role: "cliente"` por defecto y solo eleva con la fila de `empleados`. Para roles en el JWT, usa `app_metadata` (solo lo escribe el service role) o un *custom access token hook*.

### M-03 — Media — Bucket público `servicios` con subida sin restricciones

- **Archivo:** `config/migration-storage-servicios.sql:1-5, 13-17`
- **Descripción:** cualquier `authenticated` (incluidos los usuarios auto-registrados de M-02) puede subir cualquier archivo, de cualquier tipo y hasta 5 MB, a un bucket público. No hay `allowed_mime_types`, y la validación `image/*` es solo del cliente (`app/dashboard/servicios/page.tsx:113`). Esto permite alojar malware o phishing en tu dominio de Supabase Storage y consumir cuota.
- **Mitigación:** `update storage.buckets set allowed_mime_types = '{image/jpeg,image/png,image/webp}' where id='servicios';`. Restringe el INSERT a empleados admin, p. ej. `with check (bucket_id='servicios' and exists (select 1 from public.empleados e where e.auth_user_id = auth.uid() and e.rol='admin'))`, o sube vía una ruta API con signed upload URL.

### M-04 — Media — Cierre de caja: reapertura y sobrescritura sin control ni auditoría

- **Archivo:** `app/api/caja/cierre/route.ts:91-105` (upsert `onConflict: "fecha"`), `:117-133` (DELETE)
- **Descripción:** una recepcionista puede reabrir (borrar) cualquier cierre, incluso de meses atrás y hecho por un admin, o volver a cerrarlo sobrescribiendo `efectivo_contado`, `diferencia` y `cerrado_por_*`. No queda rastro. Es la vía típica para ocultar un faltante de efectivo. El cierre de días futuros **sí** está bloqueado (`:34`, correcto).
- **PoC:** `DELETE /api/caja/cierre?fecha=2026-10-01` → `POST /api/caja/cierre {"fecha":"2026-10-01","efectivo_contado":<esperado>}` → la diferencia desaparece.
- **Mitigación:** restringe DELETE y sobrescritura a `admin`. Cambia el `upsert` por un `insert` (error 409 si ya existe). Guarda los cierres anulados en una tabla `cierres_caja_log` (quién, cuándo, valores previos) en vez de borrarlos.

### M-05 — Media — Se registran movimientos en un día ya cerrado

- **Archivo:** `app/api/caja/route.ts:160-198`
- **Descripción:** `POST /api/caja` (egresos y cobros) no comprueba si existe un `cierres_caja` para el día actual de Lima. Tras cerrar, se pueden seguir sumando egresos o cobros, y el cierre guardado queda desalineado con los movimientos reales.
- **Mitigación:** antes de insertar, `select 1 from cierres_caja where fecha = limaTodayKey()` → 409 "La caja de hoy está cerrada; reábrela". Mejor aún, hazlo dentro de `cobrar_cita` y de un RPC `registrar_egreso` para que sea atómico.

### M-06 — Media — Asignación masiva (mass assignment) en servicios y clientes

- **Archivos:** `app/api/servicios/route.ts:14` (`insert([body])`), `app/api/servicios/[id]/route.ts:9` (`update(body)`), `app/api/clientes/route.ts:14` (`insert([body])`)
- **Descripción:** el body completo va a la base de datos: se pueden fijar `id`, `created_at`, `precio` y `estado`, y cualquier columna futura. Combinado con A-01, cualquiera puede cambiar precios.
- **Mitigación:** whitelist explícita de campos con tipos y longitudes (como ya haces en `promociones/[id]` y `empleados`). Considera `zod` para validar.

### M-07 — Media — Dependencias con vulnerabilidades conocidas (`npm audit --omit=dev`)

- **Archivo:** `package.json`
- **Resultado:** 1 crítica, 3 altas y 1 moderada.
  - `next` 15.5.26 — **crítica**, rango ≤ 15.5.27: envenenamiento de caché SSG/ISR. Afecta sobre todo a despliegues self-hosted; en Vercel el impacto es menor, pero actualiza igual.
  - `sharp` < 0.35.5 — alta (librsvg).
  - `source-map-js` 1.0.0–1.2.1 — alta (DoS).
  - `vite` 8.3.0–8.3.2 — alta (launch-editor en Windows). Llega por `@tailwindcss/vite`, que **no se usa**: el proyecto usa Tailwind 3 con PostCSS.
  - `postcss-selector-parser` < 6.1.5 — moderada.
- **Mitigación:** `npm i next@latest` (15.5.x parcheada), `npm uninstall @tailwindcss/vite`, `npm audit fix`. Mueve `typescript` y `@types/*` a `devDependencies`.

### B-01 — Baja — `/dashboard/*` protegido solo en el cliente

- **Archivo:** `middleware.ts:4-11`, `components/layout/DashboardAccess.tsx:15-30`
- **Descripción:** el middleware solo añade cabeceras y no valida la sesión. La protección es client-side (`DashboardAccess` con `getUser()`, que sí valida contra el servidor de Auth). Como las páginas son cascarones y los datos salen de `/api`, el riesgo real son las APIs (A-01), no el HTML. La sesión vive en `localStorage` (`lib/supabase.ts`), no en cookies, así que el middleware no la vería.
- **Mitigación:** aceptable si A-01 queda corregido. Si quieres defensa en profundidad, migra a `@supabase/ssr` con cookies y verifica `getUser()` en middleware para `/dashboard`.

### B-02 — Baja — Falta CSP; las cabeceras no cubren `/api`

- **Archivo:** `middleware.ts:4-15`, `next.config.js`
- **Bien hecho:** `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` y `poweredByHeader: false`. Vercel añade HSTS por defecto en sus dominios.
- **Falta:** `Content-Security-Policy`. Tampoco hay HSTS explícito para un dominio propio, y el `matcher` excluye `api/`.
- **Mitigación:** define las cabeceras en `next.config.js → headers()` para `/:path*`, con una CSP inicial como `default-src 'self'; img-src 'self' data: https://<proyecto>.supabase.co; connect-src 'self' https://<proyecto>.supabase.co; frame-ancestors 'none'; object-src 'none'; base-uri 'self'` (más `script-src 'self' 'unsafe-inline'` o nonces para Next). Empieza en modo `Report-Only`.

### B-03 — Baja — Autorización de rol ausente en reportes y dashboard

- **Archivos:** `app/api/reportes/route.ts:58-64`, `app/api/dashboard/route.ts:6`
- **Descripción:** cualquier empleado, incluida una manicurista, ve los ingresos mensuales. Si es una decisión de negocio, documéntala. Si no, exige `roles: ["admin"]`. Además, `reportes` duplica la lógica de autenticación en lugar de usar `requireEmployeeRequest`.

### B-04 — Baja — TOCTOU en el cobro de citas canceladas

- **Archivo:** `app/api/caja/route.ts:181-196`, `config/database.sql:326-333`
- **Descripción:** el chequeo `estado === "cancelada"` se hace fuera de la transacción. Si la cita se cancela entre ese SELECT y la RPC, se cobra igual. `cobrar_cita` tampoco valida `estado`.
- **Bien hecho:** el **doble cobro está prevenido** por tres mecanismos: `SELECT ... FOR UPDATE` sobre la cita, `EXISTS` sobre pagos, y `UNIQUE (id_cita)` en `pagos`. Dos peticiones simultáneas serializan y la segunda falla.
- **Mitigación:** dentro de `cobrar_cita`, `IF v_cita.estado = 'cancelada' THEN RAISE EXCEPTION ...`. Valida también `p_metodo_pago` contra una lista (`efectivo`, `yape`, `plin`, `tarjeta`, `transferencia`).

### B-05 — Baja — Campos de texto sin límite de longitud

- **Archivos:** `app/api/caja/route.ts:162-163` (`concepto`, `referencia`, `observaciones`, `metodo_pago` de egresos), `:190-194` (`observaciones`, `metodo_pago` del cobro), `app/api/citas/route.ts:57` (`notas`), `app/api/citas/[id]/route.ts:73-75`, `app/api/citas/route.ts:37` (`hora_fin` arbitrario cuando la duración es 0), y servicios y clientes.
- **Bien hecho:** `desde`, `hasta` y `fecha` de caja usan `isValidDateKey` (regex estricta + validación de calendario, `lib/lima-time.ts:57`). El rango máximo es de 366 días. Los adicionales están limitados a 20 y a 120 caracteres, tanto en la API como en SQL. `observaciones` del cierre está limitado a 500 caracteres.
- **Mitigación:** limita los campos (p. ej. concepto ≤ 120, observaciones ≤ 500, notas ≤ 1000), valida `fecha` de citas con `isValidDateKey` y `hora_fin` con `toMinutes`. Añade `CHECK (char_length(...))` en la base de datos.

### B-06 — Baja — Mensajes de error internos devueltos al cliente

- **Archivos:** casi todas las rutas devuelven `error.message` de PostgREST o Auth (p. ej. `app/api/caja/route.ts:87,164,197`, `app/api/empleados/route.ts:59,69`, `app/api/reportes/route.ts:134`).
- **Descripción:** revela nombres de tablas, columnas, restricciones y si un email existe en Auth (`authCreateError.message`).
- **Mitigación:** registra el detalle en el servidor (`console.error`) y devuelve un mensaje genérico. Mapea solo los errores esperados (las excepciones de `cobrar_cita` son seguras de mostrar).

### B-07 — Baja — Sin rate limiting en login y registro

- **Archivo:** `app/api/auth/login/route.ts`, `app/api/auth/register/route.ts`
- **Descripción:** Supabase Auth aplica sus propios límites por IP, pero el proxy de Next hace que todas las peticiones salgan de la IP de Vercel, lo que diluye ese límite por IP.
- **Mitigación:** rate limit por IP del cliente (Vercel KV/Upstash) o llama a Supabase Auth directamente desde el navegador. Activa CAPTCHA en Supabase Auth.

### B-08 — Baja — Carrera al borrar el último administrador

- **Archivo:** `app/api/empleados/[id]/route.ts:175-190`
- **Descripción:** el conteo de admins y el borrado no son atómicos. Si dos admins se borran mutuamente a la vez, el equipo se queda con 0 admins.
- **Mitigación:** un RPC con `LOCK`/`FOR UPDATE`, o un trigger que impida borrar o degradar al último admin. Valida también `rol` contra la whitelist en el POST (`app/api/empleados/route.ts:46`; hoy solo lo protege el CHECK de la base de datos).

---

## 3. Lo que está bien implementado

- **Tablas de dinero cerradas:** `REVOKE ALL` + RLS sin políticas en `pagos`, `pago_adicionales`, `movimientos_caja` y `cierres_caja`. `cobrar_cita` solo puede ejecutarla `service_role` y es `SECURITY INVOKER`, no `DEFINER`.
- **Rutas de caja:** validan el token con `auth.getUser(token)` (verificación en el servidor de Auth, no solo decodificar el JWT) y el rol desde la tabla, no desde `user_metadata`, **antes** de crear el cliente admin.
- **Doble cobro imposible** (ver B-04). El descuento total no puede superar el precio de la cita.
- **No hay inyección SQL:** no se usa `.or()`/`.filter()` con interpolación de strings y todos los filtros van parametrizados por PostgREST. El único punto débil es el `ilike` con comodines (M-01).
- **Sin XSS evidente:** no hay `dangerouslySetInnerHTML`, `eval`, `new Function` ni `innerHTML`, y React escapa nombre, teléfono y concepto. `servicio.imagen` se usa como `src` de `<img>`, que no ejecuta `javascript:`.
- **CSRF no aplica a las APIs:** se autentican con `Authorization: Bearer`, no con cookies.
- **Secretos:** `SUPABASE_SERVICE_ROLE_KEY` solo se lee en `lib/supabase-admin.ts`, importado únicamente por route handlers. No hay `NEXT_PUBLIC_` con secretos. `.env*` está en `.gitignore` y la rama publicada (`origin/main`) no contiene ninguna clave.
- **Logout:** `supabase.auth.signOut()` (scope `global` por defecto, `SupabaseProvider.tsx:112`) revoca los refresh tokens en el servidor. El access token sigue siendo un JWT válido hasta que expira (1 h por defecto).
- **Gestión de empleados:** `/api/empleados` POST/PATCH/DELETE exigen admin, impiden borrarse a sí mismo y protegen al último admin (salvo la carrera de B-08).
- `server/actions.ts` **no se importa** en ningún sitio, así que Next no expone esas server actions. Bórralo: si alguien lo importa, serían endpoints públicos sin autorización.

---

## 4. Top 5 riesgos y plan de acción inmediato

| # | Riesgo | Acción (orden) | Esfuerzo |
|---|---|---|---|
| 1 | **C-01** Cualquiera se hace admin | Hoy: ejecutar el SQL de C-01 en producción. Revisar `select email, rol, created_at from empleados` en busca de filas o roles desconocidos. | 15 min |
| 2 | **C-02** PII y precios editables con la anon key | Hoy: `revoke` + quitar políticas de escritura en `clientes`, `citas`, `cita_detalles`, `servicios`, `promociones`, `configuracion` y `categorias`; dejar solo un SELECT público filtrado para el catálogo. Requiere el paso 3 en el mismo despliegue, o el dashboard dejará de leer. | 1–2 h |
| 3 | **A-01** APIs sin auth | Añadir `requireEmployeeRequest` a todas las rutas no públicas, pasarlas al cliente admin, crear un `apiFetch` con Bearer en el frontend y blanquear campos (M-06). Desplegar junto con el paso 2. | 3–4 h |
| 4 | **A-02 / A-03** Credenciales | Rotar la service role key y actualizarla en Vercel. Borrar las refs `cline/*` y `agents/*`. Vaciar y eliminar `password_hash`. Comprobar que ninguna cuenta use `admin123`. | 30 min |
| 5 | **M-02 / M-03 / M-01** Registro abierto + storage + ilike | Desactivar el signup público y borrar `/api/auth/register`. Añadir `allowed_mime_types` y la política de admin al bucket. Autorizar por `auth_user_id`. | 1 h |

Después: M-04/M-05 (integridad del cierre), M-07 (`npm audit fix`, actualizar Next) y CSP.

---

## 5. Checklist de hardening

**RLS / base de datos**
- [ ] Ninguna política `USING (true)` / `WITH CHECK (true)` para INSERT/UPDATE/DELETE en tablas `public`.
- [ ] Todas las políticas con `TO authenticated` o `TO anon` explícito, nunca implícito (`PUBLIC`).
- [ ] `empleados`: solo lectura de la propia fila (`auth_user_id = auth.uid()`), sin escritura desde el cliente y `password_hash` eliminado.
- [ ] `clientes`, `citas`, `cita_detalles`, `configuracion`: sin acceso anon ni authenticated (solo service role vía `/api`).
- [ ] `servicios`, `categorias`, `promociones`: solo `SELECT` anon filtrado.
- [ ] Storage `servicios`: `allowed_mime_types` y INSERT solo para admin.
- [ ] `cobrar_cita`: validar `estado` y `metodo_pago`.
- [ ] Bloqueo de movimientos en días cerrados y auditoría de reaperturas.
- [ ] Seed sin credenciales.

**Autenticación y autorización**
- [ ] Signup público desactivado en Supabase y `/api/auth/register` eliminado.
- [ ] Confirmación de email activada.
- [ ] Autorización por `auth_user_id`, no por `ilike(email)`.
- [ ] Roles en `app_metadata` o en la tabla, nunca en `user_metadata`.
- [ ] Todas las rutas `/api` no públicas con `requireEmployeeRequest` y roles explícitos.
- [ ] Service role solo después de autorizar (arreglar `categorias`).
- [ ] Rate limit / CAPTCHA en login.

**Validación de entrada**
- [ ] Whitelist de campos en todos los `insert`/`update` (sin `insert([body])`).
- [ ] Fechas con `isValidDateKey` y horas con `toMinutes` en citas.
- [ ] Límites de longitud en todos los strings y `CHECK` equivalentes en SQL.
- [ ] Enums (`metodo_pago`, `rol`, `estado`) validados en la API.
- [ ] Errores genéricos al cliente.

**Cabeceras**
- [ ] CSP (empezar en `Report-Only`).
- [ ] HSTS explícito si hay dominio propio.
- [ ] Cabeceras aplicadas también a `/api`.
- [ ] `X-Frame-Options`, `nosniff`, `Referrer-Policy` y `Permissions-Policy`: ya presentes.

**Secretos y dependencias**
- [ ] Service role key rotada y refs git de checkpoints purgadas.
- [ ] `.next/standalone/.env` fuera de cualquier copia o despliegue manual.
- [ ] `next` actualizado a una 15.5.x parcheada, `@tailwindcss/vite` eliminado y `npm audit` sin altas ni críticas.
- [ ] `server/actions.ts`, `lib/password.ts` y `scripts/setup-local.ts` eliminados si no se usan.
- [ ] Escaneo de secretos en CI (gitleaks / GitHub secret scanning + push protection).
