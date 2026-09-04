# FitCheck — Spec-Status

**Tipo:** estado de desarrollo (no sustituye a `SPEC.md`)
**Fecha:** 2026-09-04
**Repo:** [github.com/SilvioWork/FitCheck](https://github.com/SilvioWork/FitCheck)
**Carpeta:** `FitCheck/` (producto **FitCheck**; la Spec original vive aquí como `SPEC.md`)

`SPEC.md` sigue siendo la fuente de la verdad de producto. Este archivo dice **qué está construido**, **cómo se usa hoy** y **qué falta**.

---

## 1. Resumen del estado

FitCheck es una PWA Vue 3 conectada a **Supabase** (Postgres, Auth magic link, RLS). Se puede registrar sesión, asistencia y series, consultar historial y preguntas negativas, gestionar catálogo y tema, e instalar en iPhone.

Hay un deploy HTTPS en Vercel y el proyecto Supabase está en uso (2 miembros, 1 sesión, catálogo sembrado). **El login desde la URL pública aún no está validado:** el magic link generado en Vercel no llegó a completar el ciclo (primero redirigía a `127.0.0.1` por Auth; después el correo integrado cortó por rate limit).

| Área | Estado |
|---|---|
| Spec y decisiones de producto | Hecho |
| Scaffold Vue 3 + Pinia + Router + PWA | Hecho |
| UI Hoy / Historial / Ajustes + tema | Hecho |
| Flujo de sesión (alta, asistencia, series) | Hecho |
| Chips Con ayuda / Fallo muscular | Hecho |
| Supabase: esquema, cliente, magic link | Hecho (proyecto FitCheck, `zrbbmqowrjfnluzfybuc`) |
| Realtime | Hecho (publicación aplicada en el proyecto) |
| Catálogo editable (alta / edición / borrado) | Hecho (políticas DELETE aplicadas) |
| Consultas «quién no asistió / no usó equipo» | Hecho |
| Icono PNG + guía Añadir a inicio | Hecho |
| Publicación en internet | Deploy HTTPS anónimo en Vercel; falta reclamar y validar login |
| Offline-first | Pendiente (fase 2) |
| Historial por sesión y por miembro (filtros) | Hecho |
| Capacitor / App Store / métricas | Fuera de v1 / fase 3 |

---

## 2. Qué está implementado

### 2.1 Producto y repo

- Nombre de producto: **FitCheck**.
- Spec v1 en `SPEC.md` (grupo 1–5, series editables, chips, tema, PWA).
- Git en `main`, remoto `https://github.com/SilvioWork/FitCheck.git`.
- `.env` local (gitignored) con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (publishable).

### 2.2 Stack

- Vue 3 + Vite + TypeScript + Vue Router + Pinia.
- `@supabase/supabase-js`.
- `vite-plugin-pwa` (standalone, iconos 192/512, `apple-touch-icon` 180).
- SQL: `supabase/schema.sql` (tablas + RLS + DELETE de catálogo), `supabase/realtime.sql` (publicación realtime), `supabase/catalogo_delete.sql` (idempotente, por si el esquema ya estaba aplicado).
- Dev: `npm run dev` → `vite --host --port 5174` (localhost y LAN `192.168.1.30`).
- `vercel.json`: rewrite SPA (`/(.*)` → `index.html`).

### 2.3 Autenticación y datos

- Login por **magic link** (`/entrar`: nombre + email). `emailRedirectTo` = `window.location.origin` (la URL desde la que se pide el enlace).
- Tras el enlace: upsert en `miembros` (`id` = `auth.uid()`).
- RLS: lectura de grupo autenticado; cada uno escribe solo su asistencia y sus series; catálogo escribible/borrable por cualquier autenticado.
- Seed de catálogo la primera vez que hay grupos vacíos.
- Realtime: canal `fitcheck-live` sobre sesiones, asistencia, series, catálogo y miembros. En Hoy aparece **En vivo** si `SUBSCRIBED`.
- Persistencia de tema en `localStorage` (`fitcheck-theme`), no en la base.

### 2.4 Pantallas y flujos

**Entrar** — magic link, sin nav inferior.

**Hoy** — crear sesión (fecha + nota), asistencia propia (Sí/No), registro de serie (ejercicio, equipo, steppers reps/peso, chips, guardar, repetir última sin copiar chips), lista de series propias, edición/borrado en hoja inferior (borrado con confirmación).

**Historial** — pestañas Sesiones / Por miembro. Sesiones: panel **Consultas** y lista; detalle `/historial/:id` con asistencia, series propias (editables) y series del resto agrupadas por miembro. Por miembro: historial filtrable por grupo muscular, equipo y fechas.

**Ajustes** — perfil y lista del grupo (solo lectura de compañeros), cerrar sesión, **En el iPhone** (pasos Añadir a inicio), catálogo (alta de equipo, ejercicio, grupo muscular), tema Claro / Oscuro / Auto.

**Navegación** — barra inferior Hoy / Historial / Ajustes; toques ≥ 44 pt; tokens CSS; selects con chevron propio.

### 2.5 Decisiones ya cerradas en código (respecto a la Spec)

- Series no son append-only.
- Nota de serie = chips «Con ayuda» y/o «Fallo muscular» (se guardan en `nota` unidos con ` · `).
- Asistencia es auto-declarada (RLS: solo tu fila).
- No hay rol admin.
- Consulta de «quién no usó X» solo sobre `presente = true`.

---

## 3. Estado operativo actual (2026-09-04, noche)

### 3.1 Supabase (FitCheck)

- Proyecto `zrbbmqowrjfnluzfybuc`, región `eu-west-2`, estado ACTIVE_HEALTHY.
- Auth: magic link (email). Panel: [URL Configuration](https://supabase.com/dashboard/project/zrbbmqowrjfnluzfybuc/auth/url-configuration).
- Datos en vivo: 2 usuarios Auth / 2 miembros, 1 sesión, 2 asistencias, 2 series; catálogo 12 grupos musculares, 12 equipos, 15 ejercicios.
- Realtime publicado sobre `sesiones`, `asistencia`, `series`, `miembros`, `grupos_musculares`, `equipos`, `ejercicios`.
- Políticas DELETE de catálogo aplicadas.

### 3.2 Vercel

- Deploy de producción **anónimo** (caduca si no se reclama): `https://temporary-nimble-basin-ycmrd13.vercel.app`
- Alias largo: `https://temporary-nimble-basin-ycmrd13-gd2qc1ypw-anon-mu-indol.vercel.app`
- Estado: Ready. La app se abre; las rutas de Vue las cubre `vercel.json`.
- El repo local **no está enlazado** a un proyecto Vercel permanente (`vercel link` pendiente).

### 3.3 Login (lo que falló hoy)

1. Un magic link pedido **desde Vercel** redirigió a `127.0.0.1` (`ERR_CONNECTION_REFUSED`). Causa: Site URL / Redirect URLs de Auth seguían en dev. Si `emailRedirectTo` no está en la allow list, Auth cae a Site URL.
2. Tras tocar URL Configuration (Auth recargó ~19:40 UTC), los reenvíos desde Vercel devolvieron **`email rate limit exceeded`** (`429 over_email_send_rate_limit`).
3. El correo integrado (`noreply@mail.app.supabase.io`) limita a **2 emails/hora en todo el proyecto**. No se sube en Rate Limits; hace falta SMTP propio (p. ej. Resend).
4. Los últimos envíos que sí salieron (~20:25 y ~20:29 hora local) se pidieron desde `127.0.0.1:5174`; esos enlaces no sirven para entrar en Vercel.
5. Login local sí ha funcionado (sesión creada, series anotadas). Login HTTPS **pendiente de un enlace nuevo** cuando pase la ventana de 1 h.

### 3.4 Cómo entrar cuando el cupo de correo vuelva

- Pedir **un solo** magic link desde la URL HTTPS de Vercel, no desde local.
- Confirmar antes en Auth:
  - Site URL: `https://temporary-nimble-basin-ycmrd13.vercel.app`
  - Redirect: esa URL `/**`, el alias largo `/**`, y las de local (`http://127.0.0.1:5174/**`, LAN).
- Un correo viejo no se «arregla» recargando: hay que generar otro.

---

## 4. Pendiente

### 4.1 Inmediato (para que el grupo lo use de verdad)

1. Esperar el cupo de correo (~1 h desde el último envío ok) y validar **un** magic link desde Vercel. No reintentar en bucle.
2. Confirmar Site URL + Redirect URLs HTTPS en Auth (si el dominio cambia al reclamar Vercel, actualizarlos).
3. Reclamar el deploy o publicar en cuenta propia (`npx vercel login` → `npx vercel --prod` / `vercel link`) para una URL estable tipo `fitcheck.vercel.app`.
4. En Vercel: variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (las de `.env`).
5. En el iPhone: Safari → URL HTTPS → magic link → Añadir a pantalla de inicio.
6. Opcional si el grupo va a pedir varios enlaces: SMTP propio, para salir del límite de 2 emails/hora.

### 4.2 Producto (Spec / roadmap, no bloquea el primer uso)

- Consulta por **grupo muscular** (además de equipo).
- Invitar / onboarding más claro (ahora cada uno se registra solo).
- Splash / pantallas de arranque iOS (varios tamaños); el icono PNG ya existe.
- Comprobar PWA en Safari iOS (service worker más restrictivo).

### 4.3 Fase 2 (Spec)

- Offline-first si la red del gym falla (IndexedDB + reintento).

### 4.4 Fase 3 / fuera de v1 (Spec)

- Capacitor / App Store / push.
- Métricas de progresión y gráficas.
- Multi-tenant.
- API de Fitness Park (no existe).

---

## 5. Cómo seguir trabajando

1. Leer `SPEC.md` para el *qué* y *por qué*.
2. Leer este archivo para el *dónde estamos*.
3. Prioridad recomendada: **validar magic link en HTTPS** → reclamar Vercel / URL fija → el grupo entra en el gym → pulir consultas/filtros solo si hacen falta.
