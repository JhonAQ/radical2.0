# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Sitio web de **Radical Camp / Radical 2.0** (campamento): landing pública + inscripciones de participantes + panel de administración/tesorería. UI y copy en español. Stack: Next.js 16 (App Router, Turbopack), React 19, Tailwind 4, Supabase (Auth, Postgres, Storage), framer-motion/gsap. Desplegado en Vercel (`radical2-0.vercel.app`).

`AGENTS.md` advierte que esta versión de Next.js tiene cambios incompatibles con lo que se conoce: lee la guía relevante en `node_modules/next/dist/docs/` antes de escribir código de Next. Ejemplo ya presente: el middleware se llama `proxy.ts` (exporta `proxy`, no `middleware`).

## Comandos

Gestor de paquetes: **pnpm**.

- `pnpm dev` — servidor de desarrollo (http://localhost:3000)
- `pnpm build` / `pnpm start` — build y servidor de producción
- `pnpm lint` — ESLint (flat config en `eslint.config.mjs`)
- No hay framework de tests configurado.
- `node scripts/optimize-hero-media.mjs` — optimiza los medios del hero (`components/hero/hero-media.json`).

Variables de entorno (ver `.env.example`, local en `.env.local`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` (o `SUPABASE_SERVICE_ROLE_KEY`; **solo servidor**, nunca con prefijo `NEXT_PUBLIC_`), y opcionales `NEXT_PUBLIC_YAPE_HOLDER` / `NEXT_PUBLIC_YAPE_PHONE`.

## Arquitectura

**Auth y sesión (Supabase SSR).** `proxy.ts` ejecuta `utils/supabase/middleware.ts` en casi todas las rutas para refrescar la sesión (`auth.getClaims()`). `utils/supabase/server.ts` crea el cliente por request con `cookies()`; `utils/supabase/client.ts` el del navegador. Login de participantes: Google OAuth (`components/auth/GoogleLoginButton.tsx`, `app/login`), que vuelve por `app/auth/callback/route.ts`; este solo acepta `next` ∈ {`/admin`, `/admin/reset`} y por defecto envía a `/inscripcion`. Los redirect URLs de Supabase deben incluir `/auth/callback` de producción y localhost.

**Rutas principales (`app/`).**
- `/` — landing compuesta de secciones en `components/{hero,about,activities,program,packing,pricing,location,layout}`. Config de sitio/contacto en `config/site.ts` y `config/contact.ts`.
- `/inscripcion` — flujo de inscripción (`components/registration/RegistrationFlow.tsx`, componente cliente grande).
- `/mi-inscripcion` (+ `historial`, `nuevo-abono`, `datos`) — panel del participante: ver estado, abonos adicionales y comprobantes.
- `/admin` — panel de administración. El grupo `(panel)` tiene un `layout.tsx` que hace de guardia: si no hay usuario con fila en `admin_users`, renderiza `AdminLoginForm` en vez de las páginas hijas. Secciones: `inscripciones` (padrón), `pagos` (validación de tesorería, separada del padrón), `equipo` (gestión de admins, solo master), `configuracion`, `cuenta`, `reportes`. Al observar un comprobante, `ReviewResolutionForm` ofrece un botón de WhatsApp prellenado (`utils/whatsapp.ts`). `/api/admin/export` genera exportaciones.
- `/admin/configuracion` edita `camp_settings` (hoy solo `preventa_deadline`, hora de Lima). El corte lo aplica la política RLS `registrations_insert` y lo lee `app/inscripcion/page.tsx`, que lo pasa a `RegistrationFlow` (modal al cerrarse la preventa).
- `/mi-inscripcion/datos` permite al participante editar sus datos (no documento ni correo) vía RPC `update_my_registration`; el admin edita todo con `admin_update_registration` (formulario en el detalle de inscripción). Ambas escriben en `registration_review_events`.

**Mutaciones admin.** Todo está en Server Actions de `app/admin/actions.ts`. `adminContext(master?)` valida sesión + rol en `admin_users` (`role`: `master` | `admin`) con el cliente de usuario (sujeto a RLS). Las operaciones de gestión de administradores usan `serviceClient()` (clave secreta, salta RLS) y exigen rol master. Si añades acciones admin, empieza siempre por `adminContext`.

**Datos (`supabase/migrations`).** Las migraciones definen inscripciones, abonos (`additional payments`), auditoría de revisiones, políticas RLS y el bucket privado `registration-receipts` para comprobantes. El participante solo ve sus propios datos/comprobantes; admins revisan; master gestiona admins. El envío de pagos es atómico vía función SQL, y hay endurecimiento de privilegios/auditoría en migraciones posteriores: cambios de esquema deben ir como nueva migración, respetando esas políticas. Tipos generados en `types/database.types.ts` (regenerar tras cambiar el esquema).

**Convenciones.** Alias `@/*` apunta a la raíz del repo. Estilos con Tailwind 4 más CSS por feature (`RegistrationFlow.css`, `PricingPlans.css`, `mi-inscripcion.css`, etc.) y `app/globals.css`. Los commits recientes apuntan a evitar apariencia "AI-slop" en el diseño (skills `avoid-ai-design`, `impeccable`, `motion` en `.agents/skills`; skills de Supabase en `.claude/skills` y `agent/skills`).

## Notas

- `README.md` es en gran parte el boilerplate de create-next-app; la sección útil es "Inscripciones y administración" (cuenta maestra, recuperación de contraseña en el mismo navegador, Yape).
- `a`, `tmp/` y `.next/` son artefactos locales, no código.
