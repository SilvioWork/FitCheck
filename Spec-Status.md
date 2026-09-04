# FitCheck — Spec-Status

**Tipo:** estado de desarrollo (no sustituye a `SPEC.md`)
**Fecha:** 2026-09-04
**Repo:** [github.com/SilvioWork/FitCheck](https://github.com/SilvioWork/FitCheck)
**Carpeta:** `FitCheck/` (producto **FitCheck**; la Spec original vive aquí como `SPEC.md`)

`SPEC.md` sigue siendo la fuente de la verdad de producto. Este archivo dice **qué está construido**, **cómo se usa hoy** y **qué falta**.

---

## 1. Resumen del estado

FitCheck es una PWA Vue 3 conectada a **Supabase** (Postgres, Auth magic link, RLS). Se puede registrar sesión, asistencia y series, consultar historial y preguntas negativas, gestionar catálogo y tema, e instalar en iPhone.

**Bloqueo para el gym:** la app solo corre en el PC (`npm run dev`). En el iPhone, en casa, se llega por LAN si el PC está encendido. **No hay URL pública HTTPS**; sin publicar (Vercel/Netlify) el grupo no puede usarla en el gimnasio.

| Área | Estado |
|---|---|
| Spec y decisiones de producto | Hecho |
| Scaffold Vue 3 + Pinia + Router + PWA | Hecho |
| UI Hoy / Historial / Ajustes + tema | Hecho |
| Flujo de sesión (alta, asistencia, series) | Hecho |
| Chips Con ayuda / Fallo muscular | Hecho |
| Supabase: esquema, cliente, magic link | Hecho (proyecto FitCheck creado) |
| Realtime en código | Hecho (requiere ejecutar `supabase/realtime.sql`) |
| Catálogo editable en la app | Hecho |
| Consultas «quién no asistió / no usó equipo» | Hecho |
| Icono PNG + guía Añadir a inicio | Hecho |
| Publicación en internet | **Pendiente** |
| Offline-first | Pendiente (fase 2) |
| Historial filtrable por miembro / grupo muscular | Parcial (sesión sí; filtros avanzados no) |
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
- SQL: `supabase/schema.sql` (tablas + RLS), `supabase/realtime.sql` (publicación realtime).
- Dev: `npm run dev` → `vite --host --port 5174` (localhost y LAN `192.168.1.30`).

### 2.3 Autenticación y datos

- Login por **magic link** (`/entrar`: nombre + email).
- Tras el enlace: upsert en `miembros` (`id` = `auth.uid()`).
- RLS: lectura de grupo autenticado; cada uno escribe solo su asistencia y sus series; catálogo escribible por cualquier autenticado.
- Seed de catálogo la primera vez que hay grupos vacíos.
- Realtime: canal `fitcheck-live` sobre sesiones, asistencia, series, catálogo y miembros. En Hoy aparece **En vivo** si `SUBSCRIBED`.
- Persistencia de tema en `localStorage` (`fitcheck-theme`), no en la base.

### 2.4 Pantallas y flujos

**Entrar** — magic link, sin nav inferior.

**Hoy** — crear sesión (fecha + nota), asistencia propia (Sí/No), registro de serie (ejercicio, equipo, steppers reps/peso, chips, guardar, repetir última sin copiar chips), lista de series propias, edición/borrado en hoja inferior (borrado con confirmación).

**Historial** — lista de sesiones; panel **Consultas** (sesión + quién no asistió / sin marcar; equipo + quién, estando presente, no lo usó); detalle `/historial/:id` con asistencia, series propias, series del resto y ausencias.

**Ajustes** — perfil y lista del grupo (solo lectura de compañeros), cerrar sesión, **En el iPhone** (pasos Añadir a inicio), catálogo (alta de equipo, ejercicio, grupo muscular), tema Claro / Oscuro / Auto.

**Navegación** — barra inferior Hoy / Historial / Ajustes; toques ≥ 44 pt; tokens CSS; selects con chevron propio.

### 2.5 Decisiones ya cerradas en código (respecto a la Spec)

- Series no son append-only.
- Nota de serie = chips «Con ayuda» y/o «Fallo muscular» (se guardan en `nota` unidos con ` · `).
- Asistencia es auto-declarada (RLS: solo tu fila).
- No hay rol admin.
- Consulta de «quién no usó X» solo sobre `presente = true`.

---

## 3. Estado operativo actual (2026-09-04)

- Proyecto Supabase **FitCheck** creado; tablas comprobadas por REST.
- Auth Site URL / Redirect pensados para **dev**: `http://127.0.0.1:5174` y `http://192.168.1.30:5174/**`. Hay que confirmar que están guardados en el dashboard.
- Primer login real y primera sesión en producción: **a validar por el grupo**.
- `realtime.sql`: **hay que ejecutarlo** en SQL Editor si aún no está; si no, el cliente se suscribe pero no llegan eventos.
- Uso en casa: PC con `npm run dev` + iPhone en la misma Wi‑Fi.
- Uso en el gym **sin PC: no posible** hasta publicar.

---

## 4. Pendiente

### 4.1 Inmediato (para que el grupo lo use de verdad)

1. Confirmar Auth URLs de **desarrollo** (paso 3).
2. Tú: magic link → crear una sesión y una serie en Supabase.
3. Compañero en casa: `http://192.168.1.30:5174/entrar` (PC encendido).
4. Ejecutar `supabase/realtime.sql` y probar dos dispositivos a la vez.
5. **Publicar la PWA** (Vercel o Netlify) y cambiar Site URL / Redirect a `https://….vercel.app/**`. Sin esto no hay gym.

### 4.2 Producto (Spec / roadmap, no bloquea el primer uso)

- Vista por **miembro** con filtros (grupo muscular, equipo, fechas) — hoy el historial es por sesión.
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
3. Prioridad recomendada: **publicar HTTPS** → validar login del grupo → pulir consultas/filtros solo si hacen falta en el gym.
