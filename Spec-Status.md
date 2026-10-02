# FitCheck — Spec-Status

**Tipo:** estado de desarrollo (no sustituye a `SPEC.md`)
**Fecha:** 2026-10-02 (etapa 1 del dashboard construida, `SPEC.md` sec. 13; la spec de producto sigue en v1.9)
**Repo:** [github.com/SilvioWork/FitCheck](https://github.com/SilvioWork/FitCheck)
**Carpeta:** `FitCheck/` (producto **FitCheck**; la Spec original vive aquí como `SPEC.md`)

`SPEC.md` sigue siendo la fuente de la verdad de producto. Este archivo dice **qué está construido**, **cómo se usa hoy** y **qué falta**.

---

## 1. Resumen del estado

FitCheck es una PWA Vue 3 conectada a **Supabase** (Postgres, Auth usuario/contraseña, RLS, Edge Function para invitar y resetear). Se puede crear el grupo con `signUp` si está vacío, invitar compañeros, registrar sesión, asistencia y series, clonar series, consultar historial paginado y gestionar catálogo y tema. Icono y guía «Añadir a inicio» hechos; la instalación en un iPhone real no está comprobada. La invitación y el reset están implementados; no hay evidencia de QA.

Hay un deploy HTTPS en Vercel y el proyecto Supabase está en uso. El magic link se retiró: el SMTP integrado (~2 emails/hora) no sirve para un grupo de hasta 5.

| Área | Estado |
|---|---|
| Spec y decisiones de producto | Escrita (v1.9). La etapa 1 del dashboard está construida (SPEC sec. 13) y no sube la versión. El texto del 2026-10-02 que la daba por «planificada, no construida» queda contrastado en esa sección. El deploy comprobado es el de la v1.6 (sec. 3.2) |
| Scaffold Vue 3 + Pinia + Router + PWA | Hecho |
| UI Hoy / Historial / Ajustes + tema | Hecho |
| Flujo de sesión (alta en cualquier fecha, asistencia de grupo, series de cualquiera, clonar series) | Hecho (clonar: v1.7) |
| Chips de marcas (ayuda, fallo y técnicas) | Hecho |
| Selector de ejercicio con filtro de búsqueda | Hecho |
| Supabase: esquema, cliente, usuario/contraseña | Hecho (proyecto FitCheck, `zrbbmqowrjfnluzfybuc`) |
| Realtime | Hecho |
| Catálogo editable + seed idempotente + nombres únicos | Hecho |
| Catálogo en Ajustes: listas filtrables (altura fija, scroll interno) | Hecho |
| Consultas «quién no asistió / no usó equipo» | Hecho |
| Historial paginado (fechas + grupo muscular) | Hecho |
| Alta de grupo, invitación y reset de contraseña | Implementados; sin evidencia de QA |
| Icono y guía «Añadir a inicio» | Icono y guía «Añadir a inicio» hechos; la instalación en un iPhone real no está comprobada. |
| Publicación en internet | HTTPS estable: https://fitcheck-silviowork89-4758.vercel.app. Último deploy comprobado: v1.6, commit `8091e41` (sec. 3.2). La spec v1.9 no consta desplegada |
| Offline-first | Pendiente (fase 2) |
| Dashboard (progreso y volumen) | Construido (SPEC sec. 13). `/` abre el dashboard; Hoy está en `/hoy`. Gráfico de progreso (pareja de barras) y de volumen (dos barras por grupo, escala común), fijar un ejercicio en el dispositivo, control «Anotar hoy». Sin presencialidad ni huecos. La suite `npm run test:e2e` del 2026-10-02 no quedó en pass: faltan credenciales de QA |
| Capacitor / App Store | Fuera de v1 / fase 3 |
| Gráficas de tendencia del historial | Sin plan de construcción. Distintas de los dos gráficos de la etapa 1 (SPEC sec. 13) |

---

## 2. Qué está implementado

### 2.1 Producto y repo

- Nombre de producto: **FitCheck**.
- Spec v1.9 en `SPEC.md` (grupo 1–5, escritura de grupo en series/asistencia, chips de técnicas, usuario/contraseña, seed único, historial paginado a 15, catálogo en Ajustes como listas filtrables, Hoy con selector de fecha, series en acordeón por ejercicio + equipo con Duplicar por SET, **clonar series de un miembro** a otros o a otro día, **selector de ejercicio con filtro de búsqueda**, Historial consulta con el mismo acordeón y SET compacto, PWA, **Tailwind v4 + iconos Lucide**). El contraste v1.8 → v1.9 está en `SPEC.md` sec. 12: el corte v1.9 es el sistema visual, no un flujo nuevo.
- Git en `main`, remoto `https://github.com/SilvioWork/FitCheck.git`.
- `.env` local (gitignored) con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (publishable).

### 2.2 Stack

- Vue 3 + Vite + TypeScript + Vue Router + Pinia.
- Tailwind CSS v4 (`@tailwindcss/vite`) sobre tokens en `src/styles/tokens.css`; utilidades compartidas `card`, `btn-primary`, `btn-ghost`, `overlay`, `sheet`.
- Iconos Lucide (`@lucide/vue`) vía `AppIcon.vue`.
- `@supabase/supabase-js`.
- `vite-plugin-pwa` (standalone, iconos 192/512, `apple-touch-icon` 180).
- SQL: `supabase/schema.sql` (tablas + RLS + unique de catálogo + RPCs), `supabase/realtime.sql`, `supabase/catalogo_delete.sql`.
- Crear el primer usuario, con el grupo vacío, no usa la Edge Function ni exige un JWT previo: `/entrar` consulta `grupo_esta_vacio()` (anon) y hace `signUp` de Supabase Auth; tras entrar, ese usuario autenticado inserta su propia fila en `miembros` solo si el grupo sigue vacío. Invitar a un compañero y resetear su contraseña sí usan la Edge Function `invitar-miembro`, con JWT obligatorio (`verify_jwt = true`) y con el llamador ya miembro del grupo; `service_role` solo dentro de la función, nunca en el cliente. Tope 5. La invitación y el reset están implementados; no hay evidencia de QA.
- Dev: `npm run dev` → `vite --host --port 5174`.
- `vercel.json`: rewrite SPA (`/(.*)` → `index.html`).

### 2.3 Autenticación y datos

- Login por **usuario + contraseña**. Auth usa el email interno `{usuario}@fitcheck.local`.
- Primer usuario: `/entrar` en modo crear grupo, con `signUp` y el grupo vacío (la regla del JWT está en la sec. 2.2; no pasa por `invitar-miembro`).
- Compañeros: un miembro los da de alta en Ajustes (tope 5), por la Edge Function. Reset de la contraseña de otro: la misma función. Implementados; sin evidencia de QA.
- RLS: solo quien tiene fila en `miembros` lee/escribe datos de producto; cualquier miembro escribe asistencia y series de cualquiera del grupo; catálogo escribible/borrable por cualquier miembro.
- Seed de catálogo idempotente (`ensure_catalogo`) + índices únicos `lower(trim(nombre))`.
- Realtime: canal `fitcheck-live`. En Hoy aparece **En vivo** si `SUBSCRIBED`.
- Persistencia de tema en `localStorage` (`fitcheck-theme`), no en la base.
- Ejercicio fijado del dashboard en `localStorage` (`fitcheck-ejercicio-fijado`), no en la base.

### 2.4 Pantallas y flujos

**Entrar** — usuario y contraseña, o crear el grupo si está vacío. Sin nav inferior. Con sesión, abre el dashboard.

**Inicio** (`/`, `name: inicio`) — dashboard de la etapa 1. Rango de la semana en curso (lunes a domingo) y **Anotar hoy** (abre `/hoy` en la fecha de hoy). Progreso: por persona, pareja de barras del peso representativo de las dos últimas veces en la ventana de dos semanas; se puede fijar un ejercicio del catálogo. Volumen: por grupo muscular, dos barras (semana anterior y semana en curso) con una sola escala, y la diferencia al final de la fila. Estados vacíos sin gráfico. No hay lista de asistencia ni huecos. En esta pantalla ningún tab de la barra queda activo.

**Hoy** (`/hoy`) — workspace por fecha (hoy por defecto; anterior / date / siguiente e Ir a hoy). Sin sesión ese día: alta con nota. Con sesión: asistencia de cualquiera (Sí/No en todas las filas), selector de miembro, registro de serie con **selector de ejercicio filtrable**, listado en acordeón por ejercicio + equipo (steppers y Duplicar en cada SET; hoja para editar ejercicio/equipo/chips/borrar). **Clonar a…** copia las series de un miembro a otros integrantes y/o a otro día (nota vacía; el destino queda presente; si el día no existe se crea la sesión). Si hay varias sesiones el mismo día, se muestra la más reciente. Tras crear se permanece en ese día.

**Historial** — pestañas Sesiones / Por miembro. Sesiones: filtros de fecha y grupo muscular, recuento, paginación; panel **Consultas**; detalle `/historial/:id` (miembro elegido: acordeón interactivo; otros integrantes: mismo acordeón, SET compacto, cerrado). Por miembro: filtros al servidor; series en acordeón por ejercicio + equipo, SET compacto, grupos cerrados; tap en la fecha para editar.

**Ajustes** — pestañas **Catálogo** (listas filtrables, apariencia, **En el iPhone**) y **Users** (perfil, invitar / resetear compañero, cambiar contraseña, cerrar sesión). Query `?vista=users` para Users.

**Navegación** — barra inferior Hoy / Historial / Ajustes con icono + etiqueta; Hoy apunta a `/hoy`; toques ≥ 44 pt; tokens CSS mapeados a Tailwind. El dashboard no añade un cuarto destino. Acciones de fila del catálogo: icono lápiz/papelera con nombre accesible Editar/Quitar; Confirmar sigue en texto.

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
- Stepper de reps/peso: tap = un paso (reps ±1, peso ±2,5 kg); mantener ≥ 1 s avanza cada 100 ms hasta soltar.
- Series del miembro en Hoy: acordeón por ejercicio + equipo; `numero_serie` 1, 2, 3… por ese grupo; Duplicar en el SET (nota vacía); sin botón «Repetir última».
- Historial consulta (Por miembro y otros integrantes en el detalle): el mismo acordeón; SET compacto (`SET N` + reps × peso + nota); grupos cerrados; sin steppers ni Duplicar.
- Selector de ejercicio con búsqueda (cierra al elegir y al tocar fuera).
- Clonar series de un miembro a otros integrantes y/o a otro día (v1.7): mismas copias de ejercicio, equipo, reps y peso; nota vacía; destinos presentes; la numeración continúa.
- Barra de fecha en Hoy: flechas y `input type="date"` en una fila que no se desborda en iPhone.

---

## 3. Entorno

La cabecera de este archivo es la fecha de la alineación documental. La foto de producción que consta comprobada es anterior y no cubre la spec v1.9.

### 3.1 Supabase (FitCheck)

- Proyecto `zrbbmqowrjfnluzfybuc`, región `eu-west-2`.
- Auth: usuario/contraseña. Panel: [URL Configuration](https://supabase.com/dashboard/project/zrbbmqowrjfnluzfybuc/auth/url-configuration) y [Providers → Email](https://supabase.com/dashboard/project/zrbbmqowrjfnluzfybuc/auth/providers): **desactivar Confirm email**.
- Cuentas de Auth documentadas: `silvio` y `armando` (emails internos `@fitcheck.local`). El grupo de producto tiene más miembros (QA ve al menos Silvio, Armando y Pia). Contraseña: coordinar en persona; no está en git.
- Realtime publicado sobre `sesiones`, `asistencia`, `series`, `miembros`, `grupos_musculares`, `equipos`, `ejercicios`.

### 3.2 Vercel

- Proyecto **fitcheck** en la cuenta `silviowork89-4758` (reclamado; ya no es anónimo).
- Producción: **https://fitcheck-silviowork89-4758.vercel.app** (SSO de Vercel desactivado para poder instalar la PWA).
- Alias antiguo, mismo deploy: `https://temporary-nimble-basin-ycmrd13.vercel.app`
- `fitcheck.vercel.app` está ocupado por otro producto ajeno; no usarlo.
- Local enlazado (`.vercel` gitignored). **Auto-deploy desde GitHub está conectado:** repo [`SilvioWork/FitCheck`](https://github.com/SilvioWork/FitCheck), rama de producción `main`. Un `git push` a `main` dispara el build (fuente `git`, no CLI). Alias de rama: `https://fitcheck-git-main-silviowork89-4758.vercel.app`. `npx vercel deploy --prod` solo hace falta si se quiere publicar sin pasar por GitHub.
- **Deploy comprobado (v1.6).** El 2026-09-13 se comprobó `main` en `8091e41` (selector de ejercicio y barra de fecha en iPhone). Auto-deploy GitHub → Vercel queda documentado como conectado: un push a `main` dispara el build.
- **Spec v1.9, sin comprobar en producción.** `SPEC.md` v1.9 (2026-09-17) ya describe, en el repo, clonar series (v1.7), el acordeón compacto de historial (v1.8) y Tailwind v4 + Lucide (v1.9). No se ha vuelto a comprobar el SHA que sirve producción. No se afirma que la v1.9 esté desplegada.
- Variables de build: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

### 3.3 Dashboard Auth (manual, una vez)

1. Providers → Email → **Confirm email**: off.
2. Opcional: desactivar magic link / OTP si el panel lo permite; la app ya no lo llama.
3. Site URL y Redirect URLs siguen haciendo falta si más adelante se usa recovery; para el login diario no.

---

## 4. Pendiente

### 4.1 Inmediato (para que el grupo lo use de verdad)

**Hecho**

1. Confirm email off.
2. URL HTTPS estable: **https://fitcheck-silviowork89-4758.vercel.app**
3. Auto-deploy GitHub → Vercel conectado (un push a `main` dispara el build; ver sec. 3.2). El último SHA comprobado en producción sigue siendo `8091e41` (v1.6).
4. Login con usuario y contraseña (cubierto en QA).

**Pendiente**

1. Cambiar la contraseña temporal de las cuentas del grupo.
2. Icono y guía «Añadir a inicio» hechos; la instalación en un iPhone real no está comprobada.

### 4.2 Producto (Spec / roadmap)

- Consulta negativa por **grupo muscular** (quién, estando presente, no lo trabajó) — fase 2, `SPEC.md` sec. 9.13.
- Icono y guía «Añadir a inicio» hechos; la instalación en un iPhone real no está comprobada.
- Splash / pantallas de arranque iOS de varios tamaños: detalle de implementación fuera del alcance de producto. No es requisito de `SPEC.md`. El código no genera esas imágenes. Lo único escrito como comportamiento de producto es que `theme-color` y `color-scheme` eviten el parpadeo del splash (`SPEC.md` sec. 6.5).

### 4.3 Fase 2 (Spec)

- Offline-first si la red del gym falla.

### 4.4 Fase 3 / fuera de v1 (Spec)

- Capacitor / App Store / push.
- Presencialidad semanal y huecos del dashboard: propuestas, fuera de la etapa 1 (`SPEC.md` sec. 13.3). La etapa 1 (progreso, volumen y «Anotar hoy») está construida.
- Gráficas de tendencia a lo largo del historial: sin plan de construcción. Distintas de los dos gráficos de la etapa 1.
- Multi-tenant.
- API de Fitness Park (no existe).

---

## 5. Cómo seguir trabajando

1. Leer `SPEC.md` para el *qué* y *por qué*.
2. Leer este archivo para el *dónde estamos*.
3. Leer `spec-test.md` para casos QA y `e2e/qa.spec.ts` para la batería.
4. Prioridad recomendada: **instalar la PWA en los iPhones** → cambiar contraseñas temporales → invitar al resto del grupo.
