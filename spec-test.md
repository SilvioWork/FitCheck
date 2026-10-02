# FitCheck — Spec de pruebas (QA)

**Tipo:** plan y registro de pruebas (no sustituye a `SPEC.md`)
**Fuente de producto:** `SPEC.md` v1.9
**Estado de código:** `Spec-Status.md`
**Fecha de apertura:** 2026-09-05
**Última ejecución registrada:** 2026-10-02 (`npm run test:e2e`: 8 passed de lógica del dashboard, la UI de `e2e/qa.spec.ts` no arrancó). No es un pass de la pantalla ni de lo ya existente. No hay ronda ni resultado de v1.8 ni de v1.9.
**QA responsable:** agente en Cursor (rol QA)

Este archivo es el cuaderno de pruebas. Cada caso tiene un ID estable. El **registro de ejecuciones** (sección 6) es el histórico: no se borra un caso al pasarlo; se añade una fila.

**Regla (2026-10-02).** Cada implementación nueva registra aquí los casos que hacen falta (sección 4, ID nuevo). Los casos anteriores no se borran: ni la fila del catálogo ni las filas ya escritas en la sección 6. En la fase final de esa implementación se corren todas las pruebas del proyecto (`npm run test:e2e`, el único script de pruebas) y se comprueba que lo nuevo y lo ya existente funcionan. El resultado se anota en la sección 6. La pasada del 2026-10-02 está en la sección 6. No es un pass: faltan las credenciales de QA y no hay `.env` de Supabase en el entorno. Los casos anteriores no se borraron.

---

## 1. Qué necesita el QA (agente) para ejecutar las pruebas

Hoy el agente **sí puede pulsar la UI** con Playwright (Chromium, viewport iPhone) contra `http://127.0.0.1:5174`. El cuaderno de casos sigue siendo este archivo; el runner está en `e2e/qa.spec.ts`.

```bash
npx playwright install chromium
# con el dev server en marcha:
QA_USER=silvio QA_PASS=… QA_USER2=armando QA_PASS2=… npm run test:e2e
```

En PowerShell: `$env:QA_USER='…'; $env:QA_PASS='…'; $env:QA_USER2='…'; $env:QA_PASS2='…'; npm run test:e2e`

**No** se guardan contraseñas en git.

### 1.1 Estado de lo pedido al usuario

| # | Qué | Estado 2026-09-05 |
|---|---|---|
| A | Permiso de escribir datos en el proyecto vivo | Concedido |
| B | Credenciales de 2 miembros | Usadas en el runner (fuera de git) |
| C | Navegador para el agente | Playwright Chromium en el repo |
| D | Confirm email off | Confirmado por el usuario |

### 1.2 Qué no cubre esta ronda (a propósito)

| # | Qué | Motivo |
|---|---|---|
| E | Segunda ventana | Cubierto: dos contextos Playwright (RT-01) |
| F | iPhone + Safari + HTTPS | Windows. Icono y guía «Añadir a inicio» hechos; la instalación en un iPhone real no está comprobada. |
| G | Contraseñas estables | No se ejecutaron AJU-02 ni AJU-05 |
| H | Tope 5 / invitar | No se creó `qa_tmp` (cuenta de Auth permanente) |

### 1.3 Lo que el agente ya tiene (no hace falta)

- Código local, `SPEC.md`, store y pantallas.
- MCP de Supabase (consultas SQL, logs, advisors) si está autenticado.
- Servidor de dev: `npm run dev` → `http://127.0.0.1:5174`.
- Comprobaciones de máquina sin UI: `npm run type-check`, `npm run lint`.

### 1.4 Datos de prueba (convención)

Prefijo **`QA-`** en notas de sesión, nombres de catálogo y usuarios invitados, para poder limpiarlos:

- Nota de sesión: `QA-2026-09-05 logout-relogin`
- Equipo de prueba: `QA-banco-tmp` (borrar al terminar si no se usó en series reales)
- Usuario invitado de prueba: `qa_tmp` — **solo si das permiso**; cuenta de Auth real, no se borra sola

**Sandbox de fechas:** sesiones, series, asistencia y notas `QA-*` **solo** se escriben en el **mes pasado, días 1 a 5**. El mes actual no se toca para meter datos de prueba. Leer hoy sí (default del date, **Ir a hoy**). Catálogo `QA-tmp-*` no es una sesión y puede crearse/borrarse.

**No** se meten contraseñas en este archivo.

### 1.5 Entorno bajo prueba

| Campo | Valor actual |
|---|---|
| App local | `http://127.0.0.1:5174` |
| App HTTPS | **https://fitcheck-silviowork89-4758.vercel.app** (proyecto Vercel `fitcheck`; alias antiguo `temporary-nimble-basin-ycmrd13.vercel.app`) |
| Supabase | proyecto `zrbbmqowrjfnluzfybuc` |
| Cuentas conocidas | `silvio`, `armando` (contraseñas **fuera de git**) |

**Regla:** las pruebas de código reciente se hacen en **local** (`5174`). Vercel solo si el cambio ya está desplegado.

---

## 2. Cómo se registra una prueba

**Estados**

| Código | Significado |
|---|---|
| `P` | Pass — cumple el resultado esperado |
| `F` | Fail — no cumple; abrir bug en sección 7 |
| `B` | Blocked — no se pudo ejecutar (falta dato, entorno, permiso) |
| `N/A` | No aplica en este entorno (ej. crear grupo con el grupo ya lleno) |
| `WIP` | En curso |

**Severidad (solo F)**

| Sev | Criterio |
|---|---|
| S1 | No se entra, se pierden datos, o se puede escribir la fila de otro |
| S2 | Flujo principal roto (sesión, serie, historial) con workaround pobre |
| S3 | Flujo secundario o mal UX recuperable |
| S4 | Cosmético / copy |

Al ejecutar: actualizar la tabla de la sección 4 (`Último`) **y** añadir fila en la sección 6. Si falla, además sección 7. Los casos que ya estaban se conservan; un ID nuevo no sustituye a uno viejo. La fase final de una implementación nueva es la de la regla del 2026-10-02, al principio de este archivo: suite completa, lo nuevo y lo ya existente. La batería mínima de la sección 5 no sustituye a esa pasada.

---

## 3. Precondiciones comunes

1. Grupo no vacío; login muestra **Entrar**, no **Crear el grupo**.
2. Seed de catálogo presente: grupos Pecho / Espalda / Pierna / Hombro; equipos y ejercicios del seed (SPEC sec. 5).
3. Barra inferior: Hoy / Historial / Ajustes (icono Lucide + texto; el nombre accesible no cambia); en `/entrar` no se ve.
4. Red disponible (v1 no es offline-first).

---

## 4. Catálogo de casos

Trazabilidad: columna **Spec** apunta a `SPEC.md`.

### 4.1 Autenticación y sesión (`AUTH`)

| ID | Caso | Pasos | Esperado | Spec | Último |
|---|---|---|---|---|---|
| AUTH-01 | Login válido | `/entrar` → usuario + contraseña ≥ 8 → **Entrar** | Va al dashboard (`/`, Inicio); nav visible (icono + etiqueta **Hoy / Historial / Ajustes**) y ningún tab activo. Hoy sigue en la barra y abre `/hoy`. El lede «Entraste como {nombre}. Puedes anotar a cualquiera.» se ve en Hoy | 6.0, 7, 13 | Última ejecución real: P 2026-09-07, contra «Va a Hoy». El arranque en el dashboard no tiene pass |
| AUTH-02 | Login inválido | Contraseña incorrecta | Se queda en Entrar; mensaje de error; no entra a Hoy | 6.0 | P 2026-09-07 e2e |
| AUTH-03 | Cerrar sesión y volver a entrar | Ajustes → pestaña **Users** → **Cerrar sesión** → login correcto | Login → dashboard (no se queda en `/entrar`) | 6.0, 13 | Última ejecución real: P 2026-09-09, contra «Login → Hoy». El destino dashboard no tiene pass |
| AUTH-04 | Guard de rutas | Sin sesión, ir a `/`, `/hoy`, `/historial`, `/ajustes` | Redirect a `/entrar` | 7, 13 | Última ejecución real: P 2026-09-07, sin `/hoy` (esa ruta no existía). `/hoy` sin sesión no tiene pass |
| AUTH-05 | Ya logueado en login | Con sesión, abrir `/entrar` | Redirect al dashboard (`/`) | 7, 13 | Última ejecución real: P 2026-09-07, contra «Redirect a Hoy». El destino dashboard no tiene pass |
| AUTH-06 | Usuario mal formado | Usuario `ab` o con espacios/mayúsculas raras | Botón **Entrar** deshabilitado o validación; no llama a Auth | 3.2, 7 | P 2026-09-07 e2e |
| AUTH-07 | Crear grupo | Solo si `grupo_esta_vacio()` | Alta + sesión + Hoy. **N/A** si el grupo ya existe | 6.0 | N/A (grupo con miembros) |
| AUTH-08 | Recarga con sesión | Logueado en Hoy → F5 | Sigue en Hoy, no pide login | 7 | P 2026-09-07 e2e |

### 4.2 Hoy — sesión, asistencia, series (`HOY`)

| ID | Caso | Pasos | Esperado | Spec | Último |
|---|---|---|---|---|---|
| HOY-01 | Crear sesión de hoy | Si no hay sesión hoy: nota `QA-…` → **Crear sesión** (fecha = hoy en el selector) | Aparece asistencia + «Anotar serie»; creador **Presente**; se permanece en hoy | 6.1 | Manual; e2e no escribe el mes actual (sandbox 1–5 mes pasado) |
| HOY-02 | Asistencia de cualquiera | Botones **Sí** / **No** en cada fila | Todas las filas tienen Sí/No; estado Presente / Ausente / Sin marcar | 6.1, 7 | P 2026-09-09 e2e (3 miembros: Silvio, Armando, Pia) |
| HOY-03 | Guardar serie | Ejercicio + equipo + reps/peso (steppers) + chips opcionales → **Guardar serie** | Feedback «Serie guardada»; acordeón «{ejercicio} · {equipo}» dentro de «Series de {nombre}»; SET 1, 2, 3… por ese grupo | 6.1 | P 2026-09-09 e2e |
| HOY-04 | Chips de nota | Marcar varias (p. ej. «Con ayuda» + «Rest-pause + dropset») al guardar | Se persisten combinables; unidas con ` · ` en orden canónico; «Rest-pause + dropset» no activa «Rest-pause» | 6.1 | P 2026-09-09 e2e |
| HOY-05 | Duplicar SET | Tras una serie, **Duplicar** en ese SET | Misma reps/peso/ejercicio/equipo del SET; **nota vacía**; aparece en el mismo acordeón | 6.1 | P 2026-09-09 e2e |
| HOY-06 | Editar serie | En el SET, **Editar** → cambiar reps/peso/equipo/nota → **Guardar cambios** | Lista actualizada; no se edita `numero_serie` a mano | 6.1 | P 2026-09-09 e2e |
| HOY-07 | Borrar serie | Editar → borrar (confirmación) | Pide confirmación; desaparece; números de ese ejercicio se compactan | 6.1 | P 2026-09-09 e2e |
| HOY-08 | Día elegido sin sesión | Con sesión hoy: elegir un día vacío | Formulario **Nueva sesión** (sin input de fecha duplicado), no el registro de hoy | 6.1 | P 2026-09-08 e2e |
| HOY-09 | En vivo | Con red, tras load | Texto **En vivo** si Realtime `SUBSCRIBED` | 4.4 | P 2026-09-13 e2e |
| HOY-10 | Serie de otro miembro | Selector → otro compañero → guardar serie | Aparece en «Series de {ese}»; no en las del logueado; ese miembro queda **Presente** | 6.1 | P 2026-09-09 e2e (Armando) |
| HOY-11 | Default hoy | Abrir Hoy | El date input vale la fecha local; `h1` **Hoy**; si hay sesión hoy, se ve el registro | 6.1 | P 2026-09-13 e2e |
| HOY-12 | Día vacío pasado | Elegir un día vacío en **días 1–5 del mes pasado** → nota `QA-…` → **Crear sesión** | Asistencia + «Anotar serie»; el selector **no** vuelve a hoy solo | 6.1 | P 2026-09-13 e2e |
| HOY-13 | Día con sesión | Cambiar a una fecha que ya tiene sesión (sandbox) | Muestra asistencia/series de ese día; se puede guardar otra serie | 6.1 | P 2026-09-13 e2e |
| HOY-14 | Día siguiente / Ir a hoy | **Día siguiente** (o anterior); luego **Ir a hoy** | Cambia la fecha del selector; Ir a hoy restaura hoy y el `h1` **Hoy** | 6.1 | P 2026-09-13 e2e |
| HOY-15 | Stepper hold-to-repeat | En sandbox: tap **Más Peso kg** = +2.5; mantener ≥ 1 s | Tras 1 s el peso sube **más de un paso** a ritmo constante; soltar detiene | 6.3 | P 2026-09-13 e2e |
| HOY-16 | Filtro del selector de ejercicio | En sandbox: abrir selector → buscar `press` → elegir | Solo coincidencias por nombre; al elegir se cierra y el trigger muestra el ejercicio; se puede guardar la serie | 6.1 | P 2026-09-13 e2e |
| HOY-17 | Clonar en la misma sesión | Con series de un miembro: **Clonar a…** → dejar el día por defecto → elegir 1+ integrantes → **Clonar series** | Cada destino recibe copias (ejercicio + equipo + reps + peso; nota vacía) en la misma sesión; quedan **Presente**; feedback «N series clonadas»; el origen no se duplica | 6.1 | P 2026-09-13 e2e |

### 4.3 Historial y consultas (`HIST`)

| ID | Caso | Pasos | Esperado | Spec | Último |
|---|---|---|---|---|---|
| HIST-01 | Lista de sesiones | Historial → pestaña Sesiones | Filas fecha + nota; tap abre `/historial/:id` | 6.2 | P 2026-09-07 e2e |
| HIST-02 | Filtro fechas | Desde / Hasta → **Aplicar** | Solo sesiones en rango; vacío: «Ninguna sesión encaja…» | 6.2 | P 2026-09-13 e2e |
| HIST-03 | Filtro grupo muscular | Elegir Pecho (u otro) → Aplicar | Lista filtrada; texto de frecuencia `N sesiones de {grupo} en este rango` | 6.2 | P 2026-09-07 e2e |
| HIST-04 | Quitar filtros | Con filtro activo → **Quitar filtros** | Vuelve la lista completa | 6.2 | P 2026-09-07 e2e |
| HIST-05 | Paginación | Solo si hay **> 15** sesiones | Anterior/Siguiente; página N / M | 6.2, 8 | B (2 sesiones; hace falta volumen) |
| HIST-06 | Detalle de sesión | Abrir una sesión | Definición actual (v1.8, sin ejecutar): asistencia, selector de miembro, series del elegido editables (acordeón + SET); otros integrantes en el mismo acordeón, SET compacto (sin Duplicar), grupos cerrados | 6.2 | Última ejecución real: P 2026-09-13, batería v1.6, contra el texto anterior («series de cualquiera editables»). El SET compacto no tiene pass |
| HIST-07 | Consulta ausentes | Panel Consultas → elegir sesión | Ausentes y sin marcar; no mezcla «no usó equipo» | 3.3, 6.2 | P 2026-09-07 e2e |
| HIST-08 | Consulta equipo | Presente que no usó el equipo Y | Sale en «quién no usó»; ausentes **no** cuentan | 3.3, 6.2 | P 2026-09-07 e2e |
| HIST-09 | Por miembro | Pestaña Por miembro → filtros grupo/equipo/fechas | Definición actual (v1.8, sin ejecutar): series de ese miembro desde servidor, agrupadas en acordeón ejercicio + equipo (SET compacto, cerrado, sin Duplicar); tap fecha abre detalle; quitar filtros restaura | 6.2 | Última ejecución real: P 2026-09-13, batería v1.6, contra el texto anterior («series desde servidor; quitar filtros restaura»). El SET compacto no tiene pass |
| HIST-10 | Consulta grupo muscular negativa | — | Fuera de v1 (SPEC 9.13, fase 2: consulta negativa por grupo muscular). No es la instalación en iPhone (esa es la 9.12) | 9.13 | N/A |
| HIST-11 | Clonar sesión pasada a otro día | Detalle de una sesión (sandbox) → elegir miembro con series → **Clonar a…** → cambiar el **día destino** a un día vacío 1–5 del mes pasado → elegir integrantes → **Clonar series** | Se crea la sesión destino si no existía; los integrantes reciben las series (reps/peso como referencia editable); quedan Presente; la numeración continúa si el día ya tenía series | 6.1 | P 2026-09-13 e2e |

### 4.4 Ajustes, catálogo, tema (`AJU`, `CAT`, `TEM`)

| ID | Caso | Pasos | Esperado | Spec | Último |
|---|---|---|---|---|---|
| AJU-01 | Perfil | Ajustes → **Users** | Nombre · @usuario; lista de compañeros; activo destacado | 6.0 | P 2026-09-09 e2e |
| AJU-02 | Cambiar mi contraseña | Users → Nueva ≥ 8 → guardar → logout → entrar con la nueva | Entra. **Coordinar**: deja la clave nueva al QA | 7 | B (no se cambian claves de las cuentas reales) |
| AJU-03 | Invitar compañero | Users → Nombre + usuario `qa_tmp` + pass ≥ 8 → **Crear cuenta** | Aviso ok; aparece en la lista; puede entrar. Tope 5 | 6.0, 7 | B (no se crea cuenta Auth extra) |
| AJU-04 | Invitar duplicado / usuario inválido | Users → Usuario existente o `ab` | Error o botón deshabilitado; no segundo miembro | 7 | B (depende de AJU-03) |
| AJU-05 | Resetear contraseña de otro | Users → Usuario del compañero + pass nueva → logout de esa cuenta → entrar | Entra con la nueva. **Coordinar** | 2.2, 7 | B (no se cambian claves) |
| CAT-01 | Seed visible | Ajustes → **Catálogo** | Grupos/equipos/ejercicios del seed en **listas** (no chips), **sin duplicados**. Recuadro de altura fija por sección | 5, 6.6 | P 2026-09-09 e2e |
| CAT-02 | Alta equipo/ejercicio/grupo | Nombre `QA-tmp-…`; buscarlo en el filtro de esa sección | Aparece en la lista filtrada y en selectores de Hoy | 5, 6.0, 6.6 | P 2026-09-09 e2e |
| CAT-03 | Nombre duplicado | Crear «Hombro» otra vez (cualquier casing) | Error «ya existe»; no duplica | 5, 10 | P 2026-09-09 e2e |
| CAT-04 | Editar ítem | En la fila: **Editar** (sin tap previo al ítem) → cambiar nombre de un `QA-tmp-…` | Se actualiza | 5, 6.6 | P 2026-09-13 e2e |
| CAT-05 | Borrar sin uso | Filtro → **Quitar** → **Confirmar** en `QA-tmp-…` no usado | Desaparece; confirmación en dos toques | 5, 6.6 | P 2026-09-13 e2e |
| CAT-06 | Borrar en uso | Filtro por el equipo de una serie → Quitar → Confirmar | Se impide (mensaje); no rompe historial; la fila sigue | 5, 6.6 | P 2026-09-13 e2e |
| CAT-07 | Filtro por nombre | Escribir un fragmento del nombre (p. ej. «press») | Solo filas cuyo **título** coincide (case-insensitive, locale `es`); el subtítulo no filtra; «Nada coincide» si no hay match | 6.6 | P 2026-09-13 e2e (ejercicios) |
| CAT-08 | Scroll interno | Catálogo con más ítems de los que caben (~5 filas) | El recuadro mide `--catalog-list-h` (240px); el scroll es de la lista, no de toda la vista de Ajustes; el input de buscar no se mueve | 6.6 | P 2026-09-13 e2e (altura 240px) |
| CAT-09 | Acciones de fila | Sin hover ni tap extra | **Editar** y **Quitar** accesibles por nombre en cada fila (icono Lucide + `aria-label` / texto oculto); Quitar pide **Confirmar** en texto | 6.6 | P 2026-09-13 e2e |
| CAT-10 | Foco del filtro | Tap en Buscar equipo/ejercicio/grupo | Anillo de 2px `--accent` en los **cuatro** lados (inset); no se pierde el borde superior | 6.6 | P 2026-09-13 e2e |
| TEM-01 | Tema Claro / Oscuro / Auto | Ajustes → **Catálogo** → segmented Claro / Oscuro / Auto (icono + etiqueta) | Cambio instantáneo; persiste tras F5 (`localStorage`); el botón sigue llamándose **Oscuro** | 6.5 | P 2026-09-09 e2e |

### 4.5 Seguridad y realtime (`RLS`, `RT`)

| ID | Caso | Pasos | Esperado | Spec | Último |
|---|---|---|---|---|---|
| RLS-01 | Editar serie ajena | Detalle/Hoy: elegir al otro, abrir una serie suya | Hay edición/borrado; guardar cambios persiste | 7 | P 2026-09-07 e2e |
| RLS-02 | Marcar asistencia ajena | Lista de asistencia | Sí/No también en la fila del compañero | 7 | P 2026-09-07 e2e |
| RT-01 | Serie en vivo | A guarda serie; B está en Hoy/detalle | B ve la serie **sin F5** (o en < ~2 s) | 4.4, 6.1 | P 2026-09-07 e2e (dos contextos) |

### 4.6 PWA e iPhone (`PWA`) — el usuario ejecuta, el QA registra

Icono y guía «Añadir a inicio» hechos; la instalación en un iPhone real no está comprobada.

| ID | Caso | Pasos | Esperado | Spec | Último |
|---|---|---|---|---|---|
| PWA-01 | HTTPS abre la app | Safari → URL de producción | Login/Hoy usable | 8, 9.12 | Pendiente |
| PWA-02 | Añadir a inicio | Compartir → Añadir a pantalla de inicio | Icono; abre standalone | 4.3, 8 | Pendiente |
| PWA-03 | Safe area / una mano | Uso en iPhone real | Nav no tapada por home indicator; toques cómodos | 6.3, 8 | Pendiente |
| PWA-04 | Deploy = código local | Comparar login/historial en Vercel vs `5174` | Mismo comportamiento **solo si** el último push está desplegado | — | Pendiente |

### 4.7 Regresión conocida (`REG`)

Bugs ya vistos en esta ronda; se reejecutan para no reabrirlos.

| ID | Caso | Esperado | Último |
|---|---|---|---|
| REG-01 | Tras login, `ensureMiembro` no hace upsert si ya existe la fila | Entra a Hoy; no «No formas parte del grupo» | P 2026-09-07 e2e (retest) |
| REG-02 | Logout → login no deja parado en `/entrar` | Navega al dashboard (no se queda en `/entrar`) | Última ejecución real: P 2026-09-13, contra «Navega a Hoy». El destino dashboard no tiene pass |
| REG-03 | Barra de fecha en iPhone | Flechas y date input a la misma altura, sin recorte ni solape (viewport 390×844) | P 2026-09-13 e2e |

### 4.8 Dashboard de arranque (`DASH`)

Etapa 1 (`SPEC.md` sec. 13). No sustituye a los casos anteriores. Sin presencialidad ni huecos.

| ID | Caso | Pasos | Esperado | Spec | Último |
|---|---|---|---|---|---|
| DASH-01 | Arranque en el dashboard | Login válido, o abrir `/` con sesión. Sin sesión, abrir `/` y `/hoy` | `/` es el dashboard (`name: inicio`, título Inicio), no Hoy. Se ve el rango lunes–domingo de la semana en curso (fecha local) y **Anotar hoy**. Barra de tres destinos: Hoy apunta a `/hoy`, Historial y Ajustes no se mueven. En el dashboard ningún tab queda activo. El login autenticado y el guard de `/entrar` abren el dashboard. Sin sesión, `/` y `/hoy` van a Entrar | 13.2 | B 2026-10-02 (UI). La ventana de fechas pasó en `dashboard-logica` |
| DASH-02 | Progreso | Con series en las dos semanas, mirar el bloque Progreso | Por persona (`series.miembro_id`, con su nombre). Una vez es una sesión con al menos una serie de ese ejercicio. Solo entran las dos últimas de la ventana (`fecha` desc, `creado_en` desc); una tercera no se compara. La serie representativa es la de mayor `peso_kg`, luego mayor `repeticiones`, luego mayor `numero_serie`. Hay fila si esos dos pesos son distintos (80 y 80.0 no; un cambio solo de reps no). Última vez arriba, anterior debajo, rótulo subió o bajó. Dentro de la persona, la fecha más reciente va primero. Se ven fecha, peso, reps de esa serie (no la suma) y el equipo. Quien no tiene cambios no sale en la lista | 13.2 | Lógica P 2026-10-02 (`dashboard-logica`). UI B: sin credenciales |
| DASH-03 | Volumen | Mirar el bloque Volumen | Por grupo muscular, `Σ (repeticiones × peso_kg)` de todas las series del grupo cuya fecha cae en la semana (lunes–domingo). No se parte por persona, ejercicio ni equipo. Cada fila: semana en curso, semana anterior y diferencia (en curso − anterior), unidad kg·rep, locale `es-ES` (entero sin decimales; si no, un decimal). Semana en cero se enseña como 0. Un grupo en 0 y 0 no ocupa fila. Orden por nombre del grupo, locale `es`. Varias sesiones el mismo día suman. Una fecha futura de esta semana cuenta. La ventana es desde el lunes anterior hasta el domingo en curso; no se lee fuera de esos catorce días | 13.2 | Lógica P 2026-10-02 (`dashboard-logica`). UI B: sin credenciales |
| DASH-04 | Gráfico de progreso | En cada ejercicio con datos de progreso o fijado | Pareja de barras horizontales, sin eje de fechas. La escala de la pareja es el mayor `peso_kg`: esa barra llena el ancho. La vez anterior usa `--text-muted`. La última usa `--accent` si subió y `--danger` si bajó. En el fijado con el mismo peso, las dos usan `--text-muted`. Al lado: kg, repeticiones y fecha. El equipo, en texto `--text-muted`, debajo del nombre del ejercicio. Con una sola vez hay una barra y «Sin vez anterior en estas dos semanas», sin barra fantasma | 13.2 | Lógica de tonos y escala P 2026-10-02 (`dashboard-logica`). UI B: sin credenciales |
| DASH-05 | Gráfico de volumen | En el bloque Volumen, si hay algún grupo con volumen | Una sola escala: el mayor volumen de cualquier grupo en cualquiera de las dos semanas llena el ancho. Cada grupo, dos barras: semana anterior `--text-muted`, semana en curso `--accent`. La diferencia al final de la fila: `--success` si es positiva, `--danger` si es negativa, `--text-muted` si es cero. Bajo el título: «tenue = semana anterior, acento = esta semana». No hay una barra por día ni por ejercicio. En vacío no se pinta el gráfico | 13.2 | Lógica de escala y ceros P 2026-10-02 (`dashboard-logica`). UI B: sin credenciales |
| DASH-06 | Fijar un ejercicio | Elegir un ejercicio del catálogo (p. ej. Press banca). Recargar. Quitar la fijación. Guardar un id que no está en `ejercicios` y recargar | Un solo ejercicio para todo el dashboard. Se guarda en `localStorage`, clave `fitcheck-ejercicio-fijado`, el id. No crea tabla. Tras recargar sigue fijado. Se puede quitar. El fijado va el primero, una subsección por miembro: dos veces (fecha, peso, reps, equipo; subió, bajó o «mismo peso»); una vez, con «Sin vez anterior en estas dos semanas»; ninguna, «Sin datos de este ejercicio en estas dos semanas». Si el fijado también cambió de peso, no se repite en la lista de cambios. Con fijado y sin otros cambios: «Ningún otro ejercicio cambió de peso en estas dos semanas.» Un id ausente del catálogo se ignora y el selector queda vacío. Catálogo vacío: el selector no ofrece opciones | 13.2 | B 2026-10-02. La UI no se ejecutó en la suite (sin credenciales). La exclusión del fijado en la lista sí pasó en `dashboard-logica` |
| DASH-07 | Anotar hoy | En Hoy, dejar la fecha en otro día. Volver a `/`. Pulsar **Anotar hoy** | Área táctil ≥ 44 pt. Abre `/hoy` (`HoyView`, `name: hoy`) con la fecha de hoy (`todayISO()`), aunque `fechaActiva` estuviera en otro día. El `h1` es Hoy. Si ese día tiene varias sesiones, sigue la de `creado_en` descendente | 13.2, 6.1 | B 2026-10-02. La UI no se ejecutó en la suite (sin credenciales) |
| DASH-08 | Estados vacíos | Sin series en las dos semanas. Con series pero sin dos veces de peso distinto. Fijar un ejercicio con y sin datos. Miembro sin series en la ventana. Fallo de la lectura de la ventana | Sin series: progreso «Nadie cambió de peso en estas dos semanas.» y volumen «Sin volumen en estas dos semanas.», sin gráfico. Con series y sin cambio de peso: el mismo texto de progreso; el fijado, si tiene datos, se muestra igual. Un miembro sin series no sale en la lista de cambios; en el fijado sí tiene «sin datos». Fallo de la lectura: el aviso de error de la app, y los dos bloques en su estado vacío | 13.2 | Textos de vacío: P 2026-10-02 en `dashboard-logica`. UI y fallo de lectura: B (sin credenciales) |

---

## 5. Batería mínima (smoke)

Orden sugerido cuando hay poco tiempo (~15 min, 1 usuario):

1. AUTH-01, AUTH-03  
2. HOY-01 (o usar sesión de hoy si ya existe), HOY-02, HOY-03, HOY-05, HOY-10, HOY-11  
3. HIST-01, HIST-06, HIST-07  
4. AJU-01, TEM-01, CAT-01, CAT-07  
5. AUTH-08  

Con 2 usuarios y permiso de datos: RLS-01, RLS-02, RT-01, HIST-08.

---

## 6. Registro de ejecuciones

| Fecha | Entorno | Quién | IDs | Resultado | Notas |
|---|---|---|---|---|---|
| 2026-09-05 | local `5174` + Supabase vivo | Usuario + agente | AUTH-01, REG-01 | F → P | Primer login con `silvio`: error «No formas parte del grupo». Causa: `upsert` de miembro chocaba con RLS (insert solo si el grupo está vacío). Fix: SELECT por `auth.uid()`; insert solo si no hay fila. |
| 2026-09-05 | local `5174` | Usuario + agente | AUTH-03, REG-02 | F → P | Ajustes → Cerrar sesión → login: se quedaba en Entrar. Causa: el guard no corre si ya estás en `/entrar`; `signIn` no asignaba `session` de inmediato. Fix: `session` al responder Auth + `router.replace({ name: 'hoy' })` + reset del store al logout. Usuario: «Perfecto ya va bien». |
| 2026-09-05 | local `5174` | QA (Playwright, 8/8) | AUTH-01..06, AUTH-08, HOY-01..07, HOY-09, HIST-01, HIST-03..04, HIST-06..09, AJU-01, CAT-01..03, CAT-05..06, TEM-01, RLS-01..02, RT-01, REG-01..02 | P | Batería `e2e/qa.spec.ts` contra Chromium viewport 390×844. Confirm email off. No se tocaron contraseñas ni se invitó `qa_tmp`. HIST-05 bloqueado (2 sesiones). HIST-02 y CAT-04 no ejecutados. PWA-* pendiente de iPhone. Quedan series de Silvio en la sesión de hoy (Sentadilla / Barra, incl. 40 kg de RT). Equipo `QA-banco-tmp` se creó y se borró. |
| 2026-09-07 | local `5174` + Supabase vivo | QA (Playwright, 8/8) | AUTH-01..06, AUTH-08, HOY-01..07, HOY-09..10, HIST-01, HIST-03..04, HIST-06..09, AJU-01, CAT-01..03, CAT-05..06, TEM-01, RLS-01..02, RT-01, REG-01..02 | P | Spec v1.2: escritura de grupo + 9 chips. Chromium viewport 390×844. RLS vivo `asistencia grupo *` / `series grupo *`. 3 miembros (Silvio, Armando, Pia). HOY-10: serie de Armando anotada por Silvio. Chips «Con ayuda · Rest-pause + dropset» sin falso positivo de Rest-pause. CAT-03 con «Hombro» (hay varios grupos Pecho*). HIST-05 no cubierto. PWA-* pendiente. |
| 2026-09-08 | local `5174` + Supabase vivo | QA (Playwright, 9/9) | AUTH-01..06, AUTH-08, HOY-01..14, HIST-01, HIST-03..04, HIST-06..09, AJU-01, CAT-01..03, CAT-05..06, TEM-01, RLS-01..02, RT-01, REG-01..02 | P | Spec v1.4: selector de fecha en Hoy. Chromium viewport 390×844. HOY-08 y HOY-11..14: default hoy, alta en día vacío, continuar día con sesión, Ir a hoy. El locator de series ya no usa `.last()` de toda la lista (hoy hay varios ejercicios). HIST-05 no cubierto. PWA-* pendiente. |
| 2026-09-09 | local `5174` + Supabase vivo | QA (Playwright, 10/10) | AUTH-01..06, AUTH-08, HOY-02..07, HOY-10..15, HIST-01, HIST-03..04, HIST-06..09, AJU-01, CAT-01..03, CAT-05..06, TEM-01, RLS-01..02, RT-01, REG-01..02 | P | Spec v1.5: acordeón por ejercicio + equipo; **Duplicar** sustituye Repetir última. Chromium 390×844. HOY-05 P. CAT-06 lee el equipo del `region` del acordeón (ya no `.row small`). Datos QA solo en mes pasado días 1–5. HIST-02, CAT-04, HIST-05, PWA-* no cubiertos. |
| 2026-09-13 | local `5174` + Supabase vivo | QA (Playwright, 11/11) | AUTH-01..06, AUTH-08, HOY-02..16, HIST-01..04, HIST-06..09, AJU-01, CAT-01..10, TEM-01, RLS-01..02, RT-01, REG-01..03 | P | Spec v1.6: filtro de ejercicio (HOY-16) + barra de fecha alineada (REG-03). Chromium 390×844. Cerrados HIST-02 y CAT-04/07..10. `type-check` y `lint` OK. HIST-05 sigue sin volumen (>15 sesiones). AJU-02..05 y PWA-* igual. |
| 2026-09-13 | local `5174` + Supabase vivo | QA (Playwright, 2/2) | HOY-17, HIST-11 | P | Spec v1.7: clonar series de un miembro a otros / a otro día. Chromium 390×844. Clonado en la misma sesión (Silvio→Armando, presente automático, origen no duplicado) y a otro día del sandbox (Silvio→Silvio, sesión destino creada). Reutiliza `series`/`asistencia`/`sesiones` sin esquema ni RLS nuevos. `type-check` y `lint` OK. Datos QA solo en mes pasado días 1–5. |
| 2026-10-02 | local, sin `QA_USER` / `QA_PASS` / `QA_USER2` / `QA_PASS2` y sin `.env` de Supabase | agente | suite `npm run test:e2e` | B | Exit code 1. 22 tests: 8 passed (`e2e/dashboard-logica.spec.ts`: ventana, progreso, volumen, formato). 1 failed y 13 did not run en `e2e/qa.spec.ts`: `beforeAll` lanza «Faltan QA_USER, QA_PASS, QA_USER2 y QA_PASS2 en el entorno.» No es un pass del dashboard ni de lo ya existente. No se anotó P en AUTH, HOY, HIST ni en la UI de DASH. |

No hay fila de v1.8 ni de v1.9. Las filas que incluyen HIST-06 y HIST-09 (hasta la batería v1.6 del 2026-09-13) ejecutaron el texto de caso anterior al SET compacto. Esa definición nueva no tiene ejecución. AJU-02..05 y AUTH-07 no son pass: invitación y reset sin evidencia de QA.

---

## 7. Bugs (abiertos y cerrados)

| ID | Sev | Caso | Descripción | Estado | Fix |
|---|---|---|---|---|---|
| BUG-01 | S1 | AUTH-01 / REG-01 | Login correcto no creaba sesión de producto: RLS bloqueaba upsert de `miembros` | Cerrado 2026-09-05 | `ensureMiembro()` sin upsert |
| BUG-02 | S1 | AUTH-03 / REG-02 | Re-login tras logout dejaba la UI en `/entrar` | Cerrado 2026-09-05 | `LoginView` navega a Hoy; `signIn` persiste sesión; reset store |

*(Añadir BUG-03… aquí. No reutilizar IDs.)*

---

## 8. Limpieza tras una ronda

Si se creó basura `QA-*`:

1. Borrar series de prueba **en el sandbox** (mes pasado, días 1–5). No se escriben series en el mes actual.
2. Borrar equipos/ejercicios/grupos `QA-*` no usados (`QA-banco-tmp` ya se quitó).
3. Sesiones `QA-*`: dejarlas o borrarlas a mano en SQL **solo** con permiso (puede haber asistencia/series).
4. Usuario `qa_tmp`: no borrar Auth sin acuerdo; queda cuenta real.

---

## 9. Cómo sigue el QA

1. Ejecutado y registrado: ronda v1.6 (2026-09-13, 11/11) y ronda v1.7 (2026-09-13, HOY-17 y HIST-11, 2/2). No hay ronda v1.8 ni v1.9, y este cuaderno no les anota un pass.
2. HIST-06 y HIST-09 ya describen el SET compacto de la v1.8. Esa definición no se ha ejecutado. La última ejecución real de esos IDs es la batería v1.6 del 2026-09-13, contra el texto de caso anterior. La columna Último separa las dos cosas; no es un pass del SET compacto.
3. Invitación y reset de contraseña: implementados según `Spec-Status.md`, sin evidencia de QA. AJU-02..05 siguen en Blocked (no se tocan claves ni se crea `qa_tmp`). AUTH-07 es N/A porque el grupo ya tiene miembros. Ninguno de esos IDs es un pass.
4. Pendiente a propósito: HIST-05 (hace falta >15 sesiones). Icono y guía «Añadir a inicio» hechos; la instalación en un iPhone real no está comprobada. PWA-01..04 siguen sin ejecutar.
5. Reejecutar `npm run test:e2e` tras cambios de UI o auth. Cuando una implementación se da por terminada, la pasada es la de la regla del 2026-10-02: todas las pruebas del proyecto, no solo el smoke de la sección 5, y se comprueba lo nuevo y lo ya existente. Los casos anteriores no se borran. La pasada del dashboard (2026-10-02) se corrió y no quedó en pass: ver la fila de la sección 6. Hace falta el `.env` y las cuatro variables QA para repetir `e2e/qa.spec.ts`.
6. Cada fail nuevo → BUG en sec. 7 y, si aplica, arreglo de código + retest del ID.

Cuando el usuario reporte un hallazgo en chat, el QA lo traduce a un ID de caso + fila de ejecución, aunque la prueba la haya hecho él.
