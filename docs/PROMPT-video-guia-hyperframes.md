# Prompt: video guía de Essence Spa con HyperFrames

> Uso: en Claude Code, dentro de este repo, escribe:
> `Lee docs/PROMPT-video-guia-hyperframes.md y ejecútalo. Empieza por el guion y muéstramelo antes de animar.`

---

## Rol y objetivo

Eres un motion designer y redactor de tutoriales. Vas a producir, con **HyperFrames** (composiciones HTML + GSAP renderizadas a MP4), un **video tutorial en español (Perú)** que enseñe paso a paso a usar el **Sistema de Gestión de Essence Spa**:

1. Cómo ingresar al sistema.
2. Cómo moverse por el panel y usar cada módulo.
3. Qué puede hacer cada tipo de usuario.

**Fuera de alcance:** no incluyas ningún rol de *Superadministrador* ni funciones de superadministración. Si encuentras algo así en el código o la base de datos, ignóralo y no lo menciones en el video.

## Herramientas

- Usa las skills locales de HyperFrames. Si no están instaladas, instálalas antes de empezar:
  ```bash
  npx skills add heygen-com/hyperframes
  ```
  Luego usa `/hyperframes` para componer, `/hyperframes-cli` para `init`, `lint`, `preview` y `render`, y `/hyperframes-media` para la narración TTS si el usuario la aprueba.
- Crea el proyecto en `video/guia-essence/` (fuera de `app/`, para que no entre al build de Next.js).
- **No uses** el MCP hosted de HeyGen (`compose` / `render_video`): desde Claude Code está deshabilitado.

## Fuente de verdad (léela antes de escribir el guion)

Verifica cada afirmación contra el código; no inventes pantallas ni botones. Archivos clave:

| Tema | Archivo |
|---|---|
| Login | `app/login/page.tsx`, `app/api/auth/login/route.ts` |
| Menú lateral y etiquetas de rol | `components/layout/Header.tsx` |
| Barra inferior móvil | `components/layout/BottomNav.tsx` |
| Resumen / inicio | `app/dashboard/page.tsx`, `components/dashboard/DashboardContent.tsx` |
| Agenda de citas | `app/dashboard/citas/page.tsx`, `components/calendar/*` |
| Clientes | `app/dashboard/clientes/page.tsx` |
| Servicios, Categorías, Promociones | `app/dashboard/{servicios,categorias,promociones}/page.tsx` |
| Equipo | `app/dashboard/empleados/page.tsx` |
| Caja y cobros | `app/dashboard/caja/page.tsx`, `app/api/caja/*` |
| Reportes | `app/dashboard/reportes/page.tsx` |
| Permisos reales (API) | `lib/employee-api-auth.ts`, `app/api/**/route.ts` |
| Colores y tipografía | `tailwind.config.ts`, `app/globals.css` |

### Roles que cubre el video

Roles asignables desde *Equipo* (ver `ROLES_PERMITIDOS` en `app/api/empleados/route.ts`), con la etiqueta que muestra el sistema:

| Rol interno | Se muestra como |
|---|---|
| `admin` | Administrador |
| `recepcionista` | Recepción |
| `manicurista` | Especialista |

### Matriz de permisos (confírmala en el código antes de usarla)

| Función | Administrador | Recepción | Especialista |
|---|:-:|:-:|:-:|
| Iniciar sesión y ver el Resumen | ✅ | ✅ | ✅ |
| Agenda: crear, editar, cambiar estado y cancelar citas | ✅ | ✅ | ✅ |
| Registrar como cliente a un invitado desde la cita | ✅ | ✅ | ✅ |
| Clientes: ver y registrar | ✅ | ✅ | ✅ |
| Servicios, Categorías y Promociones: **ver** | ✅ | ✅ | ✅ |
| Servicios, Categorías y Promociones: **crear / editar / eliminar** | ✅ | ❌ | ❌ |
| Equipo: ver | ✅ | ✅ | ✅ |
| Equipo: crear, editar, cambiar rol y contraseña | ✅ | ❌ | ❌ |
| Caja y cobros: cobrar citas, ingresos/egresos, cierre de caja | ✅ | ✅ | ❌ (el menú no aparece) |
| Reportes | ✅ | ✅ | ✅ |

Si el código contradice esta tabla, gana el código: corrige la tabla y avísame en el resumen del guion.

## Estructura del video

Duración objetivo: **3 a 4 minutos**, 1920×1080, 30 fps. Capítulos con un título visible en pantalla:

1. **Intro (≈10 s)** — logo/nombre "Essence Spa", "Sistema de Gestión", qué aprenderás.
2. **Ingresar al sistema (≈25 s)** — abrir la URL, pantalla de login, escribir email y contraseña, botón *Iniciar Sesión*, mensaje de error si los datos son incorrectos, llegada al panel. Mostrar cómo cerrar sesión (icono arriba a la derecha).
3. **Conoce el panel (≈20 s)** — menú lateral en escritorio, menú hamburguesa y barra inferior en celular, nombre y rol del usuario en la cabecera, enlace "Ver página pública".
4. **Resumen (≈15 s)** — "Así va tu día", próximas citas, accesos directos.
5. **Agenda de citas (≈40 s)** — *Nueva cita*: cliente, uno o varios servicios, empleado, fecha y hora (horario de Perú), notas, duración y total calculados. Filtros por estado (Pendientes, Confirmadas, En curso, Completadas, Canceladas). Editar una cita. Registrar a un invitado como cliente.
6. **Clientes (≈15 s)** — buscar y registrar clientes.
7. **Catálogo (≈30 s)** — Categorías → Servicios (nombre, precio, duración, imagen) → Promociones (descuento %, vigencia). Etiqueta visible: *"Solo Administrador puede modificar"*.
8. **Caja y cobros (≈35 s)** — *Cobrar cita* con adicionales y descuento, ingresos y egresos del día, balance y *Cierre de caja* (efectivo esperado vs. contado, diferencia). Etiqueta: *"Administrador y Recepción"*.
9. **Reportes (≈15 s)** — ingresos y servicios pagados por periodo.
10. **¿Qué puede hacer cada usuario? (≈30 s)** — una tarjeta por rol (Administrador, Recepción, Especialista) con sus funciones, y al final la matriz de permisos animada fila por fila.
11. **Cierre (≈8 s)** — recordatorio: "¿Olvidaste tu contraseña? Pídela al Administrador" (verifica que no exista un flujo de recuperación antes de decirlo) y logo.

## Estilo visual

- Usa la identidad real del sistema: verde de marca (`brand-green`), fondo crema (`brand-screen` / `#F5F3EE`), tipografía display de títulos y sans para el texto, iconos `lucide-react` equivalentes. Lee los valores exactos de `tailwind.config.ts`.
- Las pantallas se muestran dentro de un marco de navegador (escritorio) o de teléfono (móvil), con un cursor animado que hace clic, zoom suave a la zona importante y resaltado de campos.
- Subtítulos siempre visibles, frases cortas, tono amable y directo ("tú").
- Transiciones sobrias; nada de efectos estridentes. Es un spa.

## Material de pantalla

Prefiere **capturas reales** del sistema a recrear la UI a mano:

1. Arranca la app local (`npm run dev`) y captura cada pantalla con el navegador integrado o Playwright, en 1440×900 y en móvil 390×844.
2. Usa solo cuentas y datos **de prueba** (de `scripts/setup-local.ts` o creados para esto). Nunca uses credenciales reales ni datos de clientes reales; si una captura los muestra, difumínalos o recrea esa parte con datos ficticios (p. ej. "María López").
3. En el video, la contraseña se muestra siempre como `••••••••`.
4. Si no se puede levantar la app, recrea las pantallas en HTML a partir de los componentes reales, manteniendo textos y etiquetas idénticos.

Guarda las capturas en `video/guia-essence/assets/`.

## Flujo de trabajo (obligatorio, con pausas)

1. **Guion primero.** Entrega en `video/guia-essence/GUION.md` una tabla por escena: n.º, duración, qué se ve, texto en pantalla, narración/subtítulo y rol al que aplica. Incluye la matriz de permisos verificada y una lista de dudas.
   → **Detente y muéstramelo. No animes hasta que lo apruebe.**
2. Con el guion aprobado: captura pantallas y muéstrame una muestra de 3–4 antes de seguir.
3. Compón las escenas con HyperFrames, pasa `lint` y abre `preview`.
4. Pregúntame si quiero narración con voz (TTS) o solo subtítulos y música suave.
5. Renderiza a `video/guia-essence/out/guia-essence.mp4` y, si lo pido, una versión vertical 1080×1920 para celular.

## Criterios de aceptación

- Ninguna mención a Superadministrador.
- Cada función atribuida a un rol coincide con los permisos del código.
- Todos los textos de botones y menús coinciden con la interfaz real.
- No aparecen credenciales ni datos personales reales.
- `hyperframes lint` sin errores y video renderizado reproducible.
- No se modifica ningún archivo fuera de `video/guia-essence/` ni se hace commit sin pedirlo.
