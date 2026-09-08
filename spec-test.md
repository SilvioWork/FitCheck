# FitCheck — Spec de pruebas (QA)

**Tipo:** plan y registro de pruebas (no sustituye a `SPEC.md`)
**Fuente de producto:** `SPEC.md` v1.4
**Estado de código:** `Spec-Status.md`
**Fecha de apertura:** 2026-09-05
**QA responsable:** agente en Cursor (rol QA)

Este archivo es el cuaderno de pruebas. Cada caso tiene un ID estable. El **registro de ejecuciones** (sección 6) es el histórico: no se borra un caso al pasarlo; se añade una fila.

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
| F | iPhone + Safari + HTTPS | Windows; PWA-* pendiente del usuario |
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

Al ejecutar: actualizar la tabla de la sección 4 (`Último`) **y** añadir fila en la sección 6. Si falla, además sección 7.

---

## 3. Precondiciones comunes

1. Grupo no vacío; login muestra **Entrar**, no **Crear el grupo**.
2. Seed de catálogo presente: grupos Pecho / Espalda / Pierna / Hombro; equipos y ejercicios del seed (SPEC sec. 5).
3. Barra inferior: Hoy / Historial / Ajustes; en `/entrar` no se ve.
4. Red disponible (v1 no es offline-first).

---

## 4. Catálogo de casos

Trazabilidad: columna **Spec** apunta a `SPEC.md`.

### 4.1 Autenticación y sesión (`AUTH`)

| ID | Caso | Pasos | Esperado | Spec | Último |
|---|---|---|---|---|---|
| AUTH-01 | Login válido | `/entrar` → usuario + contraseña ≥ 8 → **Entrar** | Va a **Hoy**; nav visible; lede «Entraste como {nombre}. Puedes anotar a cualquiera.» | 6.0, 7 | P 2026-09-07 e2e |
| AUTH-02 | Login inválido | Contraseña incorrecta | Se queda en Entrar; mensaje de error; no entra a Hoy | 6.0 | P 2026-09-07 e2e |
| AUTH-03 | Cerrar sesión y volver a entrar | Ajustes → pestaña **Users** → **Cerrar sesión** → login correcto | Login → Hoy (no se queda en `/entrar`) | 6.0 | Pendiente retest (pestaña Users) |
| AUTH-04 | Guard de rutas | Sin sesión, ir a `/`, `/historial`, `/ajustes` | Redirect a `/entrar` | 7 | P 2026-09-07 e2e |
| AUTH-05 | Ya logueado en login | Con sesión, abrir `/entrar` | Redirect a Hoy | 7 | P 2026-09-07 e2e |
| AUTH-06 | Usuario mal formado | Usuario `ab` o con espacios/mayúsculas raras | Botón **Entrar** deshabilitado o validación; no llama a Auth | 3.2, 7 | P 2026-09-07 e2e |
| AUTH-07 | Crear grupo | Solo si `grupo_esta_vacio()` | Alta + sesión + Hoy. **N/A** si el grupo ya existe | 6.0 | N/A (grupo con miembros) |
| AUTH-08 | Recarga con sesión | Logueado en Hoy → F5 | Sigue en Hoy, no pide login | 7 | P 2026-09-07 e2e |

### 4.2 Hoy — sesión, asistencia, series (`HOY`)

| ID | Caso | Pasos | Esperado | Spec | Último |
|---|---|---|---|---|---|
| HOY-01 | Crear sesión de hoy | Si no hay sesión hoy: nota `QA-…` → **Crear sesión** (fecha = hoy en el selector) | Aparece asistencia + «Anotar serie»; creador **Presente**; se permanece en hoy | 6.1 | P 2026-09-07 e2e (sesión ya existía; se usó) |
| HOY-02 | Asistencia de cualquiera | Botones **Sí** / **No** en cada fila | Todas las filas tienen Sí/No; estado Presente / Ausente / Sin marcar | 6.1, 7 | P 2026-09-07 e2e (3 miembros: Silvio, Armando, Pia) |
| HOY-03 | Guardar serie | Ejercicio + equipo + reps/peso (steppers) + chips opcionales → **Guardar serie** | Feedback «Serie guardada»; lista «Series de {nombre}»; `numero_serie` 1, 2, 3… | 6.1 | P 2026-09-07 e2e |
| HOY-04 | Chips de nota | Marcar varias (p. ej. «Con ayuda» + «Rest-pause + dropset») al guardar | Se persisten combinables; unidas con ` · ` en orden canónico; «Rest-pause + dropset» no activa «Rest-pause» | 6.1 | P 2026-09-07 e2e |
| HOY-05 | Repetir última | Tras una serie, **Repetir última** | Misma reps/peso/ejercicio/equipo del miembro **seleccionado**; **nota vacía** | 6.1 | P 2026-09-07 e2e |
| HOY-06 | Editar serie | Abrir serie → cambiar reps/peso/equipo/nota → **Guardar cambios** | Lista actualizada; no se edita `numero_serie` a mano | 6.1 | P 2026-09-07 e2e |
| HOY-07 | Borrar serie | Editar → borrar (confirmación) | Pide confirmación; desaparece; números de ese ejercicio se compactan | 6.1 | P 2026-09-07 e2e |
| HOY-08 | Día elegido sin sesión | Con sesión hoy: elegir un día vacío | Formulario **Nueva sesión** (sin input de fecha duplicado), no el registro de hoy | 6.1 | P 2026-09-08 e2e |
| HOY-09 | En vivo | Con red, tras load | Texto **En vivo** si Realtime `SUBSCRIBED` | 4.4 | P 2026-09-07 e2e |
| HOY-10 | Serie de otro miembro | Selector → otro compañero → guardar serie | Aparece en «Series de {ese}»; no en las del logueado; ese miembro queda **Presente** | 6.1 | P 2026-09-07 e2e (Armando) |
| HOY-11 | Default hoy | Abrir Hoy | El date input vale la fecha local; `h1` **Hoy**; si hay sesión hoy, se ve el registro | 6.1 | P 2026-09-08 e2e |
| HOY-12 | Día vacío pasado | Elegir un día sin sesión (p. ej. hace 14–40 días) → nota `QA-…` → **Crear sesión** | Asistencia + «Anotar serie»; el selector **no** vuelve a hoy solo | 6.1 | P 2026-09-08 e2e |
| HOY-13 | Día con sesión | Cambiar a una fecha que ya tiene sesión | Muestra asistencia/series de ese día; se puede guardar otra serie | 6.1 | P 2026-09-08 e2e |
| HOY-14 | Día siguiente / Ir a hoy | **Día siguiente** (o anterior); luego **Ir a hoy** | Cambia la fecha del selector; Ir a hoy restaura hoy y el `h1` **Hoy** | 6.1 | P 2026-09-08 e2e |

### 4.3 Historial y consultas (`HIST`)

| ID | Caso | Pasos | Esperado | Spec | Último |
|---|---|---|---|---|---|
| HIST-01 | Lista de sesiones | Historial → pestaña Sesiones | Filas fecha + nota; tap abre `/historial/:id` | 6.2 | P 2026-09-07 e2e |
| HIST-02 | Filtro fechas | Desde / Hasta → **Aplicar** | Solo sesiones en rango; vacío: «Ninguna sesión encaja…» | 6.2 | Pendiente (no se rellenó desde/hasta en esta ronda) |
| HIST-03 | Filtro grupo muscular | Elegir Pecho (u otro) → Aplicar | Lista filtrada; texto de frecuencia `N sesiones de {grupo} en este rango` | 6.2 | P 2026-09-07 e2e |
| HIST-04 | Quitar filtros | Con filtro activo → **Quitar filtros** | Vuelve la lista completa | 6.2 | P 2026-09-07 e2e |
| HIST-05 | Paginación | Solo si hay **> 15** sesiones | Anterior/Siguiente; página N / M | 6.2, 8 | B (2 sesiones; hace falta volumen) |
| HIST-06 | Detalle de sesión | Abrir una sesión | Asistencia, selector de miembro, series de cualquiera editables | 6.2 | P 2026-09-07 e2e |
| HIST-07 | Consulta ausentes | Panel Consultas → elegir sesión | Ausentes y sin marcar; no mezcla «no usó equipo» | 3.3, 6.2 | P 2026-09-07 e2e |
| HIST-08 | Consulta equipo | Presente que no usó el equipo Y | Sale en «quién no usó»; ausentes **no** cuentan | 3.3, 6.2 | P 2026-09-07 e2e |
| HIST-09 | Por miembro | Pestaña Por miembro → filtros grupo/equipo/fechas | Series de ese miembro desde servidor; quitar filtros restaura | 6.2 | P 2026-09-07 e2e |
| HIST-10 | Consulta grupo muscular negativa | — | Fuera de v1 (SPEC 9.10) | 9 | N/A |

### 4.4 Ajustes, catálogo, tema (`AJU`, `CAT`, `TEM`)

| ID | Caso | Pasos | Esperado | Spec | Último |
|---|---|---|---|---|---|
| AJU-01 | Perfil | Ajustes → **Users** | Nombre · @usuario; lista de compañeros; activo destacado | 6.0 | Pendiente retest (pestaña Users) |
| AJU-02 | Cambiar mi contraseña | Users → Nueva ≥ 8 → guardar → logout → entrar con la nueva | Entra. **Coordinar**: deja la clave nueva al QA | 7 | B (no se cambian claves de las cuentas reales) |
| AJU-03 | Invitar compañero | Users → Nombre + usuario `qa_tmp` + pass ≥ 8 → **Crear cuenta** | Aviso ok; aparece en la lista; puede entrar. Tope 5 | 6.0, 7 | B (no se crea cuenta Auth extra) |
| AJU-04 | Invitar duplicado / usuario inválido | Users → Usuario existente o `ab` | Error o botón deshabilitado; no segundo miembro | 7 | B (depende de AJU-03) |
| AJU-05 | Resetear contraseña de otro | Users → Usuario del compañero + pass nueva → logout de esa cuenta → entrar | Entra con la nueva. **Coordinar** | 2.2, 7 | B (no se cambian claves) |
| CAT-01 | Seed visible | Ajustes → **Catálogo** | Grupos/equipos/ejercicios del seed en **listas** (no chips), **sin duplicados**. Recuadro de altura fija por sección | 5, 6.6 | Pendiente retest (UI lista; runner usa `list` + filtro) |
| CAT-02 | Alta equipo/ejercicio/grupo | Nombre `QA-tmp-…`; buscarlo en el filtro de esa sección | Aparece en la lista filtrada y en selectores de Hoy | 5, 6.0, 6.6 | Pendiente retest |
| CAT-03 | Nombre duplicado | Crear «Hombro» otra vez (cualquier casing) | Error «ya existe»; no duplica | 5, 10 | P 2026-09-07 e2e |
| CAT-04 | Editar ítem | En la fila: **Editar** (sin tap previo al ítem) → cambiar nombre de un `QA-tmp-…` | Se actualiza | 5, 6.6 | Pendiente |
| CAT-05 | Borrar sin uso | Filtro → **Quitar** → **Confirmar** en `QA-tmp-…` no usado | Desaparece; confirmación en dos toques | 5, 6.6 | Pendiente retest |
| CAT-06 | Borrar en uso | Filtro por el equipo de una serie → Quitar → Confirmar | Se impide (mensaje); no rompe historial; la fila sigue | 5, 6.6 | Pendiente retest |
| CAT-07 | Filtro por nombre | Escribir un fragmento del nombre (p. ej. «press») | Solo filas cuyo **título** coincide (case-insensitive, locale `es`); el subtítulo no filtra; «Nada coincide» si no hay match | 6.6 | Pendiente |
| CAT-08 | Scroll interno | Catálogo con más ítems de los que caben (~5 filas) | El recuadro mide `--catalog-list-h` (240px); el scroll es de la lista, no de toda la vista de Ajustes; el input de buscar no se mueve | 6.6 | Pendiente |
| CAT-09 | Acciones de fila | Sin hover ni tap extra | **Editar** y **Quitar** visibles en cada fila; Quitar pide Confirmar | 6.6 | Pendiente |
| CAT-10 | Foco del filtro | Tap en Buscar equipo/ejercicio/grupo | Anillo de 2px `--accent` en los **cuatro** lados (inset); no se pierde el borde superior | 6.6 | Pendiente |
| TEM-01 | Tema Claro / Oscuro / Auto | Ajustes → **Catálogo** → segmented | Cambio instantáneo; persiste tras F5 (`localStorage`) | 6.5 | Pendiente retest (pestaña Catálogo) |

### 4.5 Seguridad y realtime (`RLS`, `RT`)

| ID | Caso | Pasos | Esperado | Spec | Último |
|---|---|---|---|---|---|
| RLS-01 | Editar serie ajena | Detalle/Hoy: elegir al otro, abrir una serie suya | Hay edición/borrado; guardar cambios persiste | 7 | P 2026-09-07 e2e |
| RLS-02 | Marcar asistencia ajena | Lista de asistencia | Sí/No también en la fila del compañero | 7 | P 2026-09-07 e2e |
| RT-01 | Serie en vivo | A guarda serie; B está en Hoy/detalle | B ve la serie **sin F5** (o en < ~2 s) | 4.4, 6.1 | P 2026-09-07 e2e (dos contextos) |

### 4.6 PWA e iPhone (`PWA`) — el usuario ejecuta, el QA registra

| ID | Caso | Pasos | Esperado | Spec | Último |
|---|---|---|---|---|---|
| PWA-01 | HTTPS abre la app | Safari → URL de producción | Login/Hoy usable | 8, 9.9 | Pendiente |
| PWA-02 | Añadir a inicio | Compartir → Añadir a pantalla de inicio | Icono; abre standalone | 4.3, 8 | Pendiente |
| PWA-03 | Safe area / una mano | Uso en iPhone real | Nav no tapada por home indicator; toques cómodos | 6.3, 8 | Pendiente |
| PWA-04 | Deploy = código local | Comparar login/historial en Vercel vs `5174` | Mismo comportamiento **solo si** el último push está desplegado | — | Pendiente |

### 4.7 Regresión conocida (`REG`)

Bugs ya vistos en esta ronda; se reejecutan para no reabrirlos.

| ID | Caso | Esperado | Último |
|---|---|---|---|
| REG-01 | Tras login, `ensureMiembro` no hace upsert si ya existe la fila | Entra a Hoy; no «No formas parte del grupo» | P 2026-09-07 e2e (retest) |
| REG-02 | Logout → login no deja parado en `/entrar` | Navega a Hoy | P 2026-09-07 e2e (retest) |

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

1. Borrar series de prueba. Tras la ronda e2e del 2026-09-05 quedan series de Silvio en la sesión de hoy; se pueden borrar desde Hoy → Series de {nombre}.
2. Borrar equipos/ejercicios/grupos `QA-*` no usados (`QA-banco-tmp` ya se quitó).
3. Sesiones `QA-*`: dejarlas o borrarlas a mano en SQL **solo** con permiso (puede haber asistencia/series).
4. Usuario `qa_tmp`: no borrar Auth sin acuerdo; queda cuenta real.

---

## 9. Cómo sigue el QA

1. Ronda e2e local v1.4 hecha (2026-09-08): selector de fecha en Hoy (HOY-08, HOY-11..14). **Retest AUTH-03, AJU-01, TEM-01, CAT-01..02, CAT-05..06** y cubrir CAT-07..10. Pendiente además: HIST-02, CAT-04, HIST-05 (volumen), AJU-02..05 (solo si se pide), PWA-* en iPhone.
2. Reejecutar `npm run test:e2e` tras cambios de UI o auth.
3. Cada fail nuevo → BUG en sec. 7 y, si aplica, arreglo de código + retest del ID.

Cuando el usuario reporte un hallazgo en chat, el QA lo traduce a un ID de caso + fila de ejecución, aunque la prueba la haya hecho él.
