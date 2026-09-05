import { test, expect, type Page } from '@playwright/test'

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
  await expect(page.getByRole('heading', { name: 'Hoy' })).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText('Sincronizando con Supabase')).toHaveCount(0, { timeout: 20_000 })
  await expect(page.getByText(/Registras como /)).toBeVisible()
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
  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: destino }).click()
  await expect(page.getByRole('heading', { name: destino })).toBeVisible()
}

async function prepararPagina(page: Page) {
  await page.addInitScript(() => {
    const kill = () => document.getElementById('__vue-devtools-container__')?.remove()
    const start = () => {
      kill()
      new MutationObserver(kill).observe(document.documentElement, { childList: true, subtree: true })
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start)
    else start()
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
    await expect(page.getByRole('heading', { name: 'Hoy' })).toHaveCount(0)
  })

  test('AUTH-01 login válido y AUTH-05 / AUTH-08 / AUTH-03', async ({ page }) => {
    await entrar(page, USER, PASS)
    await expect(page.getByText(/Registras como /)).toBeVisible()

    await page.goto('/entrar')
    await esperarHoy(page)

    await page.reload()
    await esperarHoy(page)

    await irA(page, 'Ajustes')
    await page.getByRole('button', { name: 'Cerrar sesión' }).click()
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
    await entrar(page, USER, PASS)
  })

  test('HOY asistencia, serie, chips, repetir, editar, borrar', async ({ page }) => {
    await entrar(page, USER, PASS)

    const nueva = page.getByRole('heading', { name: 'Nueva sesión' })
    const tuSerie = page.getByRole('heading', { name: 'Tu serie' })
    if (await nueva.isVisible().catch(() => false)) {
      await page.getByLabel('Nota (opcional)').fill('QA-2026-09-05 smoke')
      await page.getByRole('button', { name: 'Crear sesión' }).click()
    }
    await expect(tuSerie).toBeVisible()

    const asistencia = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Asistencia' }) })
    await expect(asistencia.getByRole('button', { name: 'Sí' })).toHaveCount(1)
    await expect(asistencia.getByRole('button', { name: 'No' })).toHaveCount(1)
    await asistencia.getByRole('button', { name: 'No' }).click()
    await expect(asistencia.getByText('Ausente')).toBeVisible()
    await asistencia.getByRole('button', { name: 'Sí' }).click()
    await expect(asistencia.getByText('Presente')).toBeVisible()

    const formSerie = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Tu serie' }) })
    const filas = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Tus series' }) }).locator('button.row')
    const antes = await filas.count()

    await formSerie.getByRole('button', { name: 'Con ayuda', exact: true }).click()
    await formSerie.getByRole('button', { name: 'Fallo muscular', exact: true }).click()
    await formSerie.getByRole('button', { name: 'Guardar serie' }).click()
    await expect(page.getByText('Serie guardada')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Tus series' })).toBeVisible()
    await expect(filas.last().getByText('Con ayuda · Fallo muscular')).toBeVisible()
    await expect(filas).toHaveCount(antes + 1)

    await page.getByRole('button', { name: 'Repetir última' }).click()
    await expect(page.getByText('Serie repetida')).toBeVisible()
    await expect(filas).toHaveCount(antes + 2)
    await expect(filas.last().getByText('Con ayuda')).toHaveCount(0)

    await filas.last().click()
    const editor = page.getByRole('dialog', { name: 'Editar serie' })
    await expect(editor.getByRole('heading', { name: 'Editar serie' })).toBeVisible()
    await editor.getByRole('button', { name: 'Más Reps' }).click()
    await editor.getByRole('button', { name: 'Guardar cambios' }).click()
    await expect(page.getByText('Serie actualizada')).toBeVisible()

    await filas.last().click()
    await editor.getByRole('button', { name: 'Borrar' }).click()
    await editor.getByRole('button', { name: 'Confirmar borrado' }).click()
    await expect(page.getByText('Serie borrada')).toBeVisible()
    await expect(filas).toHaveCount(antes + 1)
  })

  test('HIST lista, filtros, consultas, detalle, por miembro', async ({ page }) => {
    await entrar(page, USER, PASS)
    await irA(page, 'Historial')

    const filas = page.locator('a.row')
    await expect(filas.first()).toBeVisible()

    await page.getByLabel('Grupo muscular').selectOption({ label: 'Pecho' })
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
      description: (await pager.count()) === 0 ? 'blocked: menos de 16 sesiones' : 'paginador visible',
    })

    await filas.first().click()
    await expect(page.getByRole('heading', { name: 'Asistencia' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Tu serie' })).toBeVisible()
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

    await expect(page.getByText('Silvio · @silvio').first()).toBeVisible()
    await expect(page.getByText('Armando · @armando')).toBeVisible()

    await page.getByRole('button', { name: 'Oscuro' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Ajustes' })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await page.getByRole('button', { name: 'Auto' }).click()

    for (const nombre of ['Pecho', 'Espalda', 'Pierna', 'Hombro']) {
      await expect(page.locator('.chip', { hasText: nombre }).first()).toBeVisible()
    }

    const tmp = page.locator('.chip', { hasText: 'QA-banco-tmp' })
    if ((await tmp.count()) === 0) {
      await page.getByPlaceholder('Máquina press banca Technogym').fill('QA-banco-tmp')
      await page.getByRole('button', { name: 'Añadir equipo' }).click()
    }
    await expect(tmp).toBeVisible()

    await page.getByPlaceholder('Core').fill('Pecho')
    await page.getByRole('button', { name: 'Añadir grupo' }).click()
    await expect(page.getByText('Ya existe «Pecho» en el catálogo.')).toBeVisible()
    await page.getByRole('button', { name: 'Cerrar', exact: true }).click()
    await tmp.click()
    await tmp.getByRole('button', { name: 'Quitar' }).click()
    await tmp.getByRole('button', { name: 'Confirmar' }).click()
    await expect(page.locator('.chip', { hasText: 'QA-banco-tmp' })).toHaveCount(0)

    await irA(page, 'Hoy')
    const detalleSerie = page.locator('.row small').first()
    const detalle = (await detalleSerie.textContent()) ?? ''
    const equipoUsado = detalle.split('·').pop()?.trim()
    test.skip(!equipoUsado, 'CAT-06: no hay serie propia para comprobar borrado en uso')
    await irA(page, 'Ajustes')
    const usado = page.locator('.chip').filter({ hasText: equipoUsado! }).first()
    await usado.click()
    await usado.getByRole('button', { name: 'Quitar' }).click()
    await usado.getByRole('button', { name: 'Confirmar' }).click()
    await expect(page.locator('.toast')).toContainText('ya está en series guardadas')
    await page.locator('.toast').getByRole('button', { name: 'Cerrar', exact: true }).click()
    await expect(page.locator('.chip', { hasText: equipoUsado! }).first()).toBeVisible()
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

    await irA(p1, 'Historial')
    await p1.locator('a.row').first().click()
    await expect(p1.getByRole('heading', { name: 'Tu serie' })).toBeVisible()

    await irA(p2, 'Historial')
    await p2.locator('a.row').first().click()

    const asistencia2 = p2.locator('article').filter({ has: p2.getByRole('heading', { name: 'Asistencia' }) })
    await expect(asistencia2.getByRole('button', { name: 'Sí' })).toHaveCount(1)
    const silvioRow = asistencia2.locator('li').filter({ hasText: 'Silvio' })
    await expect(silvioRow.getByRole('button', { name: 'Sí' })).toHaveCount(0)

    await expect(p2.getByRole('heading', { name: 'Silvio' })).toBeVisible()
    const bloqueSilvio = p2.locator('article').filter({ has: p2.getByRole('heading', { name: 'Silvio' }) })
    await expect(bloqueSilvio.getByRole('button', { name: 'Guardar cambios' })).toHaveCount(0)

    const marcas40 = bloqueSilvio.getByText('40 kg')
    const antesRt = await marcas40.count()
    for (let i = 0; i < 8; i++) {
      await p1.getByRole('button', { name: 'Más Peso kg' }).click()
    }
    await p1.getByRole('button', { name: 'Guardar serie' }).click()
    await expect(p1.getByText('Serie guardada')).toBeVisible()
    await expect(marcas40).toHaveCount(antesRt + 1, { timeout: 8_000 })

    await silvio.close()
    await armando.close()
  })
})
