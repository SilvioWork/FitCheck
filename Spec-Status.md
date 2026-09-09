# FitCheck — Spec-Status

**Tipo:** estado de desarrollo (no sustituye a `SPEC.md`)
**Fecha:** 2026-09-08
**Repo:** [github.com/SilvioWork/FitCheck](https://github.com/SilvioWork/FitCheck)
**Carpeta:** `FitCheck/` (producto **FitCheck**; la Spec original vive aquí como `SPEC.md`)

`SPEC.md` sigue siendo la fuente de la verdad de producto. Este archivo dice **qué está construido**, **cómo se usa hoy** y **qué falta**.

---

## 1. Resumen del estado

FitCheck es una PWA Vue 3 conectada a **Supabase** (Postgres, Auth usuario/contraseña, RLS, Edge Function de alta de miembros). Se puede crear el grupo, invitar compañeros, registrar sesión, asistencia y series, consultar historial paginado, gestionar catálogo y tema, e instalar en iPhone.

Hay un deploy HTTPS en Vercel y el proyecto Supabase está en uso. El magic link se retiró: el SMTP integrado (~2 emails/hora) no sirve para un grupo de hasta 5.

| Área | Estado |
|---|---|
| Spec y decisiones de producto | Hecho (v1.5) |
| Scaffold Vue 3 + Pinia + Router + PWA | Hecho |
| UI Hoy / Historial / Ajustes + tema | Hecho |
| Flujo de sesión (alta en cualquier fecha, asistencia de grupo, series de cualquiera) | Hecho |
| Chips de marcas (ayuda, fallo y técnicas) | Hecho |
| Supabase: esquema, cliente, usuario/contraseña | Hecho (proyecto FitCheck, `zrbbmqowrjfnluzfybuc`) |
| Realtime | Hecho |
| Catálogo editable + seed idempotente + nombres únicos | Hecho |
| Catálogo en Ajustes: listas filtrables (altura fija, scroll interno) | Hecho |
| Consultas «quién no asistió / no usó equipo» | Hecho |
| Historial paginado (fechas + grupo muscular) | Hecho |
| Alta de grupo e invitación de compañeros | Hecho |
| Icono PNG + guía Añadir a inicio | Hecho |
| Publicación en internet | HTTPS estable: https://fitcheck-silviowork89-4758.vercel.app |
| Offline-first | Pendiente (fase 2) |
| Capacitor / App Store / métricas | Fuera de v1 / fase 3 |

---

## 2. Qué está implementado

### 2.1 Producto y repo

- Nombre de producto: **FitCheck**.
- Spec v1.5 en `SPEC.md` (grupo 1–5, escritura de grupo en series/asistencia, chips de técnicas, usuario/contraseña, seed único, historial paginado, catálogo en Ajustes como listas filtrables, Hoy con selector de fecha, series en acordeón por ejercicio + equipo con Duplicar por SET, PWA).
- Git en `main`, remoto `https://github.com/SilvioWork/FitCheck.git`.
- `.env` local (gitignored) con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (publishable).

### 2.2 Stack

- Vue 3 + Vite + TypeScript + Vue Router + Pinia.
- `@supabase/supabase-js`.
- `vite-plugin-pwa` (standalone, iconos 192/512, `apple-touch-icon` 180).
- SQL: `supabase/schema.sql` (tablas + RLS + unique de catálogo + RPCs), `supabase/realtime.sql`, `supabase/catalogo_delete.sql`.
- Edge Function `invitar-miembro` desplegada (invitar compañero y reset de contraseña; JWT obligatorio).
- Dev: `npm run dev` → `vite --host --port 5174`.
- `vercel.json`: rewrite SPA (`/(.*)` → `index.html`).

### 2.3 Autenticación y datos

- Login por **usuario + contraseña**. Auth usa el email interno `{usuario}@fitcheck.local`.
- Primer usuario: `/entrar` en modo crear grupo (Edge Function, grupo vacío).
- Compañeros: un miembro los da de alta en Ajustes (tope 5).
- RLS: solo quien tiene fila en `miembros` lee/escribe datos de producto; cualquier miembro escribe asistencia y series de cualquiera del grupo; catálogo escribible/borrable por cualquier miembro.
- Seed de catálogo idempotente (`ensure_catalogo`) + índices únicos `lower(trim(nombre))`.
- Realtime: canal `fitcheck-live`. En Hoy aparece **En vivo** si `SUBSCRIBED`.
- Persistencia de tema en `localStorage` (`fitcheck-theme`), no en la base.

### 2.4 Pantallas y flujos

**Entrar** — usuario y contraseña, o crear el grupo si está vacío. Sin nav inferior.

**Hoy** — workspace por fecha (hoy por defecto; anterior / date / siguiente e Ir a hoy). Sin sesión ese día: alta con nota. Con sesión: asistencia de cualquiera (Sí/No en todas las filas), selector de miembro, registro de serie, listado en acordeón por ejercicio + equipo (steppers y Duplicar en cada SET; hoja para chips/borrar). Tras crear se permanece en ese día.

**Historial** — pestañas Sesiones / Por miembro. Sesiones: filtros de fecha y grupo muscular, recuento, paginación; panel **Consultas**; detalle `/historial/:id`. Por miembro: filtros al servidor.

**Ajustes** — pestañas **Catálogo** (listas filtrables, apariencia, **En el iPhone**) y **Users** (perfil, invitar / resetear compañero, cambiar contraseña, cerrar sesión). Query `?vista=users` para Users.

**Navegación** — barra inferior Hoy / Historial / Ajustes; toques ≥ 44 pt; tokens CSS.

### 2.5 Decisiones ya cerradas en código (respecto a la Spec)

- Series no son append-only.
- Nota de serie = chips combinables (ayuda, fallo y técnicas de intensidad).
- Asistencia y series de grupo: cualquiera anota a cualquiera; al guardar serie se marca presente.
- No hay rol admin.
- Consulta de «quién no usó X» solo sobre `presente = true`.
- Login sin correo.
- Catálogo sin nombres duplicados.
- Catálogo en Ajustes: listas filtrables de filas (no chips wrapping); filtro por nombre; scroll interno (`--catalog-list-h`); foco del filtro con anillo inset `--accent`. Los chips de marcas de serie no cambian.
- Ajustes agrupado en pestañas Catálogo / Users (sin cambio de reglas).
- Hoy anclado a una fecha elegible (pasado, hoy o futuro); si ese día ya tiene sesión, se continúa; si no, se crea. No es un planificador de rutinas.
- Stepper de reps/peso: tap = un paso; mantener ≥ 1 s avanza a ritmo constante (100 ms) hasta soltar.
- Series del miembro en Hoy: acordeón por ejercicio + equipo; `numero_serie` 1, 2, 3… por ese grupo; Duplicar en el SET (nota vacía); sin botón «Repetir última».

---

## 3. Estado operativo actual (2026-09-05)

### 3.1 Supabase (FitCheck)

- Proyecto `zrbbmqowrjfnluzfybuc`, región `eu-west-2`.
- Auth: usuario/contraseña. Panel: [URL Configuration](https://supabase.com/dashboard/project/zrbbmqowrjfnluzfybuc/auth/url-configuration) y [Providers → Email](https://supabase.com/dashboard/project/zrbbmqowrjfnluzfybuc/auth/providers): **desactivar Confirm email**.
- Cuentas actuales: `silvio` y `armando` (emails internos `@fitcheck.local`). Contraseña temporal de migración: cambiarla en Ajustes al entrar.
- Realtime publicado sobre `sesiones`, `asistencia`, `series`, `miembros`, `grupos_musculares`, `equipos`, `ejercicios`.

### 3.2 Vercel

- Proyecto **fitcheck** en la cuenta `silviowork89-4758` (reclamado; ya no es anónimo).
- Producción: **https://fitcheck-silviowork89-4758.vercel.app** (SSO de Vercel desactivado para poder instalar la PWA).
- Alias antiguo, mismo deploy: `https://temporary-nimble-basin-ycmrd13.vercel.app`
- `fitcheck.vercel.app` está ocupado por otro producto ajeno; no usarlo.
- Local enlazado (`.vercel` gitignored). Auto-deploy desde GitHub: falta Login Connection de GitHub en Vercel; mientras tanto `npx vercel deploy --prod`.
- Variables de build: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

### 3.3 Dashboard Auth (manual, una vez)

1. Providers → Email → **Confirm email**: off.
2. Opcional: desactivar magic link / OTP si el panel lo permite; la app ya no lo llama.
3. Site URL y Redirect URLs siguen haciendo falta si más adelante se usa recovery; para el login diario no.

---

## 4. Pendiente

### 4.1 Inmediato (para que el grupo lo use de verdad)

1. Confirm email off — hecho.
2. Entrar con usuario/contraseña y **cambiar la contraseña temporal**.
3. URL HTTPS estable — **https://fitcheck-silviowork89-4758.vercel.app**
4. En el iPhone: Safari → esa URL → Añadir a pantalla de inicio.
5. Opcional: en Vercel, conectar GitHub (Login Connection) para desplegar con cada `git push`.

### 4.2 Producto (Spec / roadmap)

- Consulta negativa por **grupo muscular** (quién, estando presente, no lo trabajó).
- Splash / pantallas de arranque iOS (varios tamaños).
- Comprobar PWA en Safari iOS.

### 4.3 Fase 2 (Spec)

- Offline-first si la red del gym falla.

### 4.4 Fase 3 / fuera de v1 (Spec)

- Capacitor / App Store / push.
- Métricas de progresión y gráficas.
- Multi-tenant.
- API de Fitness Park (no existe).

---

## 5. Cómo seguir trabajando

1. Leer `SPEC.md` para el *qué* y *por qué*.
2. Leer este archivo para el *dónde estamos*.
3. Prioridad recomendada: **instalar la PWA en los iPhones** → cambiar contraseñas temporales → invitar al resto del grupo.
