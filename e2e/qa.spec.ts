import { test, expect, type Locator, type Page } from '@playwright/test'

const USER = process.env.QA_USER ?? ''
const PASS = process.env.QA_PASS ?? ''
const USER2 = process.env.QA_USER2 ?? ''
const PASS2 = process.env.QA_PASS2 ?? ''

test.beforeAll(() => {
  if (!USER || !PASS || !USER2 || !PASS2) {
    throw new Error('Faltan QA_USER, QA_PASS, QA_USER2 y QA_PASS2 en el entorno.')
  }
})

async function esperarHoy(page: Page) {
  await expect(page.getByRole('heading', { name: 'Hoy', exact: true })).toBeVisible({
    timeout: 20_000,
  })
  await expect(page.getByText('Sincronizando con Supabase')).toHaveCount(0, { timeout: 20_000 })
  await expect(page.getByText(/Entraste como /)).toBeVisible()
  await expect(page.getByText(/Puedes anotar a cualquiera/)).toBeVisible()
}

async function entrar(page: Page, usuario: string, password: string) {
  await page.goto('/entrar')
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible({ timeout: 20_000 })
  await page.getByLabel('Usuario').fill(usuario)
  await page.getByLabel('Contraseña').fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await esperarHoy(page)
}

async function irA(page: Page, destino: 'Hoy' | 'Historial' | 'Ajustes') {
  await page
    .getByRole('navigation', { name: 'Principal' })
    .getByRole('link', { name: destino })
    .click()
  if (destino === 'Hoy') {
    await expect(page.getByLabel('Fecha', { exact: true })).toBeVisible()
    await expect(page.getByText(/Puedes anotar a cualquiera/)).toBeVisible()
    return
  }
  await expect(page.getByRole('heading', { name: destino })).toBeVisible()
}

function todayISO(): string {
  const d = new Date()
  const z = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`
}

function addDaysISO(isoDate: string, n: number): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  d.setDate(d.getDate() + n)
  const z = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`
}

function fechasSandboxQA(): string[] {
  const now = new Date()
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
  const month = now.getMonth() === 0 ? 12 : now.getMonth()
  const z = (n: number) => String(n).padStart(2, '0')
  return [1, 2, 3, 4, 5].map((day) => `${year}-${z(month)}-${z(day)}`)
}

function assertSandbox(iso: string) {
  const allowed = fechasSandboxQA()
  if (!allowed.includes(iso)) {
    throw new Error(`QA solo escribe en ${allowed.join(', ')}; se pidió ${iso}`)
  }
}

async function esperarFechaCargada(page: Page) {
  await expect(page.getByText('Cargando sesión…')).toHaveCount(0)
  await expect(page.getByLabel('Fecha', { exact: true })).toBeEnabled()
}

async function irAFecha(page: Page, iso: string) {
  const fecha = page.getByLabel('Fecha', { exact: true })
  await expect(fecha).toBeEnabled()
  await fecha.fill(iso)
  await fecha.dispatchEvent('change')
  await expect(fecha).toHaveValue(iso)
  await esperarFechaCargada(page)
}

async function irADiaVacioSandbox(page: Page): Promise<string | null> {
  const nueva = page.getByRole('heading', { name: 'Nueva sesión' })
  for (const d of fechasSandboxQA()) {
    await irAFecha(page, d)
    if (await nueva.isVisible()) return d
  }
  return null
}

async function irASandboxQA(page: Page, nota = 'QA-sandbox'): Promise<string> {
  const anotar = page.getByRole('heading', { name: 'Anotar serie' })
  const nueva = page.getByRole('heading', { name: 'Nueva sesión' })
  for (const d of fechasSandboxQA()) {
    await irAFecha(page, d)
    if (await anotar.isVisible().catch(() => false)) {
      assertSandbox(d)
      return d
    }
    if (await nueva.isVisible().catch(() => false)) {
      assertSandbox(d)
      await page.getByLabel('Nota (opcional)').fill(nota)
      await page.getByRole('button', { name: 'Crear sesión' }).click()
      await expect(anotar).toBeVisible()
      return d
    }
  }
  throw new Error('Sandbox 1–5 del mes pasado no disponible')
}

async function prepararPagina(page: Page) {
  await page.addInitScript(() => {
    const kill = () => document.getElementById('__vue-devtools-container__')?.remove()
    const start = () => {
      kill()
      new MutationObserver(kill).observe(document.documentElement, {
        childList: true,
        subtree: true,
      })
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start)
    else start()
  })
}

async function nombreOpcion(select: Locator): Promise<string> {
  return select.evaluate((el) => {
    const opt = (el as HTMLSelectElement).selectedOptions[0]
    return (opt?.textContent ?? '').split(' · ')[0].trim()
  })
}

async function nombreEjercicioSeleccionado(scope: Locator): Promise<string> {
  const texto = await scope.getByTestId('ejercicio-selector-trigger').locator('strong').textContent()
  return (texto ?? '').trim()
}

function bloqueSeries(page: Page, miembro: string) {
  return page.locator('article').filter({
    has: page.getByRole('heading', { name: `Series de ${miembro}` }),
  })
}

function regionGrupo(page: Page, miembro: string, ejercicio: string, equipo: string) {
  return bloqueSeries(page, miembro).getByRole('region', {
    name: `Series de ${ejercicio} · ${equipo}`,
  })
}

test.beforeEach(async ({ page }) => {
  await prepararPagina(page)
})

test.describe('FitCheck QA', () => {
  test('AUTH-04 guard sin sesión', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
    await page.goto('/historial')
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
    await page.goto('/ajustes')
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
  })

  test('AUTH-06 usuario corto deshabilita Entrar', async ({ page }) => {
    await page.goto('/entrar')
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
    await page.getByLabel('Usuario').fill('ab')
    await page.getByLabel('Contraseña').fill('12345678')
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeDisabled()
  })

  test('AUTH-02 login inválido', async ({ page }) => {
    await page.goto('/entrar')
    await page.getByLabel('Usuario').fill(USER)
    await page.getByLabel('Contraseña').fill('clave-incorrecta-xyz')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.locator('.err')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Hoy', exact: true })).toHaveCount(0)
  })

  test('AUTH-01 login válido y AUTH-05 / AUTH-08 / AUTH-03', async ({ page }) => {
    await entrar(page, USER, PASS)
    await expect(page.getByText(/Entraste como /)).toBeVisible()

    await page.goto('/entrar')
    await esperarHoy(page)

    await page.reload()
    await esperarHoy(page)

    await irA(page, 'Ajustes')
    await page.getByRole('tab', { name: 'Users' }).click()
    await page.getByRole('button', { name: 'Cerrar sesión' }).click()
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
    await entrar(page, USER, PASS)
  })

  test('HOY asistencia, serie, chips, duplicar, editar, borrar, otro miembro', async ({ page }) => {
    await entrar(page, USER, PASS)
    await irASandboxQA(page, 'QA-sandbox smoke')

    const anotarSerie = page.getByRole('heading', { name: 'Anotar serie' })
    await expect(anotarSerie).toBeVisible()

    const asistencia = page
      .locator('article')
      .filter({ has: page.getByRole('heading', { name: 'Asistencia' }) })
    const filasAsis = asistencia.locator('li')
    const nMiembros = await filasAsis.count()
    expect(nMiembros).toBeGreaterThanOrEqual(2)
    await expect(asistencia.getByRole('button', { name: 'Sí' })).toHaveCount(nMiembros)
    await expect(asistencia.getByRole('button', { name: 'No' })).toHaveCount(nMiembros)
    const silvioAsis = asistencia.locator('li').filter({ hasText: 'Silvio' })
    await silvioAsis.getByRole('button', { name: 'No' }).click()
    await expect(silvioAsis.getByText('Ausente')).toBeVisible()
    await silvioAsis.getByRole('button', { name: 'Sí' }).click()
    await expect(silvioAsis.getByText('Presente')).toBeVisible()

    const formSerie = page
      .locator('article')
      .filter({ has: page.getByRole('heading', { name: 'Anotar serie' }) })
    const ejercicio = await nombreEjercicioSeleccionado(formSerie)
    const equipo = await nombreOpcion(formSerie.getByLabel('Equipo'))
    const setsSilvio = bloqueSeries(page, 'Silvio').getByTestId('serie-set')
    const grupo = () => regionGrupo(page, 'Silvio', ejercicio, equipo)
    const setsGrupo = () => grupo().getByTestId('serie-set')
    const antes = await setsSilvio.count()
    const antesGrupo = await setsGrupo().count()

    await formSerie.getByRole('button', { name: 'Con ayuda', exact: true }).click()
    await formSerie.getByRole('button', { name: 'Rest-pause + dropset', exact: true }).click()
    await formSerie.getByRole('button', { name: 'Guardar serie' }).click()
    await expect(page.getByText('Serie guardada')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Series de Silvio' })).toBeVisible()
    await expect(page.getByRole('button', { name: `${ejercicio} · ${equipo}` })).toBeVisible()
    const conChips = setsGrupo().filter({ hasText: 'Con ayuda · Rest-pause + dropset' })
    await expect(conChips.last()).toBeVisible()
    await expect(
      setsGrupo().filter({ hasText: 'Con ayuda · Rest-pause · Rest-pause + dropset' }),
    ).toHaveCount(0)
    await expect(setsSilvio).toHaveCount(antes + 1)
    await expect(setsGrupo()).toHaveCount(antesGrupo + 1)

    await setsGrupo().last().getByRole('button', { name: 'Duplicar' }).click()
    await expect(page.getByText('Serie duplicada')).toBeVisible()
    await expect(setsSilvio).toHaveCount(antes + 2)
    await expect(setsGrupo()).toHaveCount(antesGrupo + 2)
    const duplicada = setsGrupo().last()
    await expect(duplicada.getByText('Con ayuda')).toHaveCount(0)

    await duplicada.getByRole('button', { name: 'Editar' }).click()
    const editor = page.getByRole('dialog', { name: 'Editar serie' })
    await expect(editor.getByRole('heading', { name: 'Editar serie' })).toBeVisible()
    await editor.getByRole('button', { name: 'Más Reps' }).click()
    await editor.getByRole('button', { name: 'Guardar cambios' }).click()
    await expect(page.getByText('Serie actualizada')).toBeVisible()

    await setsGrupo().last().getByRole('button', { name: 'Editar' }).click()
    await editor.getByRole('button', { name: 'Borrar' }).click()
    await editor.getByRole('button', { name: 'Confirmar borrado' }).click()
    await expect(page.getByText('Serie borrada')).toBeVisible()
    await expect(setsSilvio).toHaveCount(antes + 1)

    await formSerie.getByRole('button', { name: 'Armando', exact: true }).click()
    await formSerie.getByRole('button', { name: 'Myo-reps', exact: true }).click()
    await formSerie.getByRole('button', { name: 'Guardar serie' }).click()
    await expect(page.getByRole('heading', { name: 'Series de Armando' })).toBeVisible()
    await expect(bloqueSeries(page, 'Armando').getByText('Myo-reps').last()).toBeVisible()
    const armandoAsis = asistencia.locator('li').filter({ hasText: 'Armando' })
    await expect(armandoAsis.getByText('Presente')).toBeVisible()

    await formSerie.getByRole('button', { name: 'Silvio', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Series de Silvio' })).toBeVisible()
    await expect(setsSilvio.filter({ hasText: 'Myo-reps' })).toHaveCount(0)
  })

  test('HOY-11..14 fecha: default, vacío sandbox, existente, navegación', async ({ page }) => {
    await entrar(page, USER, PASS)

    const fecha = page.getByLabel('Fecha', { exact: true })
    const hoy = todayISO()
    await expect(fecha).toHaveValue(hoy)
    await expect(page.getByRole('heading', { name: 'Hoy', exact: true })).toBeVisible()

    const nueva = page.getByRole('heading', { name: 'Nueva sesión' })
    const anotar = page.getByRole('heading', { name: 'Anotar serie' })
    if (await anotar.isVisible().catch(() => false)) {
      await expect(anotar).toBeVisible()
    } else {
      await expect(nueva).toBeVisible()
    }

    const vacio = await irADiaVacioSandbox(page)
    test.skip(!vacio, 'HOY-12: los días 1–5 del mes pasado ya tienen sesión')
    assertSandbox(vacio!)
    await expect(nueva).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Hoy', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Ir a hoy' })).toBeVisible()
    await page.getByLabel('Nota (opcional)').fill('QA-sandbox historico')
    await page.getByRole('button', { name: 'Crear sesión' }).click()
    await expect(anotar).toBeVisible()
    await expect(fecha).toHaveValue(vacio!)

    await page.getByRole('button', { name: 'Día siguiente' }).click()
    await expect(fecha).toHaveValue(addDaysISO(vacio!, 1))
    await esperarFechaCargada(page)
    await irAFecha(page, vacio!)
    await expect(anotar).toBeVisible()
    await expect(page.getByText('QA-sandbox historico')).toBeVisible()
    await page.getByRole('button', { name: 'Guardar serie' }).click()
    await expect(page.getByText('Serie guardada')).toBeVisible()

    await page.getByRole('button', { name: 'Ir a hoy' }).click()
    await expect(fecha).toHaveValue(hoy)
    await esperarFechaCargada(page)
    await expect(page.getByRole('heading', { name: 'Hoy', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ir a hoy' })).toHaveCount(0)
  })

  test('HOY-15 stepper hold-to-repeat peso', async ({ page }) => {
    await entrar(page, USER, PASS)
    await irASandboxQA(page, 'QA-sandbox stepper')

    const formSerie = page
      .locator('article')
      .filter({ has: page.getByRole('heading', { name: 'Anotar serie' }) })
    const masPeso = formSerie.getByRole('button', { name: 'Más Peso kg' })
    const valorPeso = masPeso.locator('xpath=preceding-sibling::span')
    await expect(valorPeso).toHaveText('20')
    await masPeso.click()
    await expect(valorPeso).toHaveText('22.5')

    const box = await masPeso.boundingBox()
    expect(box).toBeTruthy()
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
    await page.mouse.down()
    await page.waitForTimeout(1300)
    await page.mouse.up()
    await expect
      .poll(async () => Number((await valorPeso.textContent()) ?? '0'))
      .toBeGreaterThan(25)
  })

  test('HIST lista, filtros, consultas, detalle, por miembro', async ({ page }) => {
    await entrar(page, USER, PASS)
    await irA(page, 'Historial')

    const filas = page.locator('a.row')
    await expect(filas.first()).toBeVisible()

    const filtros = page
      .locator('article')
      .filter({ has: page.getByRole('heading', { name: 'Filtros' }) })
    const grupoFiltro = filtros.getByLabel('Grupo muscular')
    const pechoId = await grupoFiltro.evaluate((el) => {
      const opt = [...el.options].find((o) => o.text.trim() === 'Pecho')
      return opt?.value ?? ''
    })
    expect(pechoId).not.toBe('')
    await grupoFiltro.selectOption(pechoId)
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByText(/sesión(es)? de Pecho en este rango/)).toBeVisible()
    await page.getByRole('button', { name: 'Quitar filtros' }).click()
    await expect(filas.first()).toBeVisible()

    await expect(page.getByRole('heading', { name: 'Consultas' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '¿Quién no asistió?' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '¿Quién no usó un equipo?' })).toBeVisible()

    const pager = page.locator('.pager')
    test.info().annotations.push({
      type: 'HIST-05',
      description:
        (await pager.count()) === 0 ? 'blocked: menos de 16 sesiones' : 'paginador visible',
    })

    await filas.first().click()
    await expect(page.getByRole('heading', { name: 'Asistencia' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Anotar serie' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Historial' }).first()).toBeVisible()

    await page.getByRole('link', { name: 'Historial' }).first().click()
    await page.getByRole('tab', { name: 'Por miembro' }).click()
    await expect(page.getByRole('heading', { name: 'Por miembro' })).toBeVisible()
    await page.getByLabel('Grupo muscular').selectOption({ label: 'Pierna' })
    await expect(page.getByText(/Ninguna serie encaja|Cargando series|×/)).toBeVisible()
    if (await page.getByRole('button', { name: 'Quitar filtros' }).isVisible()) {
      await page.getByRole('button', { name: 'Quitar filtros' }).click()
    }
  })

  test('AJU perfil, tema, catálogo seed / dup / tmp', async ({ page }) => {
    await entrar(page, USER, PASS)
    await irA(page, 'Ajustes')
    await page.getByRole('tab', { name: 'Users' }).click()

    await expect(page.getByText('Silvio · @silvio').first()).toBeVisible()
    await expect(page.getByText('Armando · @armando')).toBeVisible()

    await page.getByRole('tab', { name: 'Catálogo' }).click()
    await page.getByRole('button', { name: 'Oscuro' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Ajustes' })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await page.getByRole('button', { name: 'Auto' }).click()

    const catalogo = page
      .locator('article')
      .filter({ has: page.getByRole('heading', { name: 'Catálogo' }) })
    const grupos = catalogo.getByRole('list', { name: 'Grupos musculares' })
    const equipos = catalogo.getByRole('list', { name: 'Equipos' })

    for (const nombre of ['Pecho', 'Espalda', 'Pierna', 'Hombro']) {
      await expect(grupos.getByRole('listitem').filter({ hasText: nombre }).first()).toBeVisible()
    }

    const buscarEquipo = catalogo.getByPlaceholder('Buscar equipo')
    await buscarEquipo.fill('QA-banco-tmp')
    const tmp = equipos.getByRole('listitem').filter({ hasText: 'QA-banco-tmp' })
    if ((await tmp.count()) === 0) {
      await buscarEquipo.fill('')
      await page.getByPlaceholder('Máquina press banca Technogym').fill('QA-banco-tmp')
      await page.getByRole('button', { name: 'Añadir equipo' }).click()
      await buscarEquipo.fill('QA-banco-tmp')
    }
    await expect(tmp).toBeVisible()

    await catalogo.getByPlaceholder('Core').fill('Hombro')
    await catalogo.getByRole('button', { name: 'Añadir grupo' }).click()
    await expect(page.locator('.toast')).toContainText('Ya existe «Hombro» en el catálogo.')
    await page.getByRole('button', { name: 'Cerrar', exact: true }).click()
    await tmp.getByRole('button', { name: 'Quitar' }).click()
    await tmp.getByRole('button', { name: 'Confirmar' }).click()
    await buscarEquipo.fill('QA-banco-tmp')
    await expect(equipos.getByRole('listitem').filter({ hasText: 'QA-banco-tmp' })).toHaveCount(0)

    await irA(page, 'Hoy')
    await irASandboxQA(page, 'QA-sandbox cat')
    const gruposSerie = page.getByRole('region', { name: /^Series de / })
    if ((await gruposSerie.count()) === 0) {
      test.skip(true, 'CAT-06: no hay serie propia para comprobar borrado en uso')
    }
    const ariaGrupo = (await gruposSerie.first().getAttribute('aria-label')) ?? ''
    const equipoUsado = ariaGrupo.replace(/^Series de /, '').split(' · ').pop()?.trim()
    test.skip(!equipoUsado, 'CAT-06: no hay serie propia para comprobar borrado en uso')
    await irA(page, 'Ajustes')
    const buscarUsado = page.getByPlaceholder('Buscar equipo')
    await buscarUsado.fill(equipoUsado!)
    const usado = page
      .getByRole('list', { name: 'Equipos' })
      .getByRole('listitem')
      .filter({ hasText: equipoUsado! })
      .first()
    await usado.getByRole('button', { name: 'Quitar' }).click()
    await usado.getByRole('button', { name: 'Confirmar' }).click()
    await expect(page.locator('.toast')).toContainText('ya está en series guardadas')
    await page.locator('.toast').getByRole('button', { name: 'Cerrar', exact: true }).click()
    await buscarUsado.fill(equipoUsado!)
    await expect(
      page
        .getByRole('list', { name: 'Equipos' })
        .getByRole('listitem')
        .filter({ hasText: equipoUsado! })
        .first(),
    ).toBeVisible()
  })

  test('HOY-16 selector ejercicio con filtro', async ({ page }) => {
    await entrar(page, USER, PASS)
    await irASandboxQA(page, 'QA-sandbox filtro-ejercicio')

    const formSerie = page
      .locator('article')
      .filter({ has: page.getByRole('heading', { name: 'Anotar serie' }) })

    const trigger = formSerie.getByTestId('ejercicio-selector-trigger')
    await expect(trigger).toBeVisible()
    await trigger.click()

    const lista = formSerie.getByRole('listbox', { name: 'Lista de ejercicios' })
    await expect(lista).toBeVisible()
    const buscarInput = formSerie.getByPlaceholder('Buscar ejercicio')
    await expect(buscarInput).toBeVisible()

    const opciones = lista.getByRole('option')
    const totalOpciones = await opciones.count()
    expect(totalOpciones).toBeGreaterThan(0)

    await page.getByRole('heading', { name: 'Anotar serie' }).click()
    await expect(lista).toHaveCount(0)

    await trigger.click()
    await expect(formSerie.getByRole('listbox', { name: 'Lista de ejercicios' })).toBeVisible()
    await buscarInput.fill('press')
    await expect(opciones).not.toHaveCount(totalOpciones)
    const opcionPress = opciones.filter({ hasText: /press/i }).first()
    await expect(opcionPress).toBeVisible()

    await opcionPress.click()
    await expect(formSerie.getByRole('listbox', { name: 'Lista de ejercicios' })).toHaveCount(0)
    await expect(trigger.locator('strong')).toContainText(/press/i)

    await formSerie.getByRole('button', { name: 'Guardar serie' }).click()
    await expect(page.getByText('Serie guardada')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Series de Silvio' })).toBeVisible()
  })

  test('RLS-01/02 y RT-01 dos miembros', async ({ browser }) => {
    const silvio = await browser.newContext({ ...test.info().project.use })
    const armando = await browser.newContext({ ...test.info().project.use })
    const p1 = await silvio.newPage()
    const p2 = await armando.newPage()
    await prepararPagina(p1)
    await prepararPagina(p2)

    await entrar(p1, USER, PASS)
    await entrar(p2, USER2, PASS2)

    await irASandboxQA(p1, 'QA-sandbox realtime')
    await irASandboxQA(p2, 'QA-sandbox realtime')
    await expect(p1.getByRole('heading', { name: 'Anotar serie' })).toBeVisible()
    await expect(p2.getByRole('heading', { name: 'Anotar serie' })).toBeVisible()

    const asistencia2 = p2
      .locator('article')
      .filter({ has: p2.getByRole('heading', { name: 'Asistencia' }) })
    await expect(asistencia2.locator('li').first()).toBeVisible()
    const nMiembros = await asistencia2.locator('li').count()
    expect(nMiembros).toBeGreaterThanOrEqual(2)
    await expect(asistencia2.getByRole('button', { name: 'Sí' })).toHaveCount(nMiembros)
    const silvioRow = asistencia2.locator('li').filter({ hasText: 'Silvio' })
    await expect(silvioRow.getByRole('button', { name: 'Sí' })).toHaveCount(1)
    await silvioRow.getByRole('button', { name: 'Sí' }).click()
    await expect(silvioRow.getByText('Presente')).toBeVisible()

    const formP2 = p2
      .locator('article')
      .filter({ has: p2.getByRole('heading', { name: 'Anotar serie' }) })
    await formP2.getByRole('button', { name: 'Silvio', exact: true }).click()
    await expect(p2.getByRole('heading', { name: 'Series de Silvio' })).toBeVisible()
    const bloqueSilvio = bloqueSeries(p2, 'Silvio')
    const setsSilvioP2 = bloqueSilvio.getByTestId('serie-set')
    if ((await setsSilvioP2.count()) > 0) {
      await setsSilvioP2.last().getByRole('button', { name: 'Editar' }).click()
      const editor = p2.getByRole('dialog', { name: 'Editar serie' })
      await expect(editor.getByRole('heading', { name: 'Editar serie' })).toBeVisible()
      await editor.getByRole('button', { name: 'Cerrar' }).click()
    }

    await expect(bloqueSilvio).toBeVisible()

    const antesRt = await setsSilvioP2.count()
    const formP1 = p1
      .locator('article')
      .filter({ has: p1.getByRole('heading', { name: 'Anotar serie' }) })
    await formP1.getByRole('button', { name: 'Silvio', exact: true }).click()
    for (let i = 0; i < 8; i++) {
      await formP1.getByRole('button', { name: 'Más Peso kg' }).click()
    }
    await formP1.getByRole('button', { name: 'Guardar serie' }).click()
    await expect(setsSilvioP2).toHaveCount(antesRt + 1, { timeout: 8_000 })

    await silvio.close()
    await armando.close()
  })
})
