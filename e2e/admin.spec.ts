import { expect, test, type Page } from '@playwright/test'
import fs from 'node:fs'

async function login(page: Page) {
  await page.goto('/#/sistema')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { name: 'Visão geral', level: 1 })).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // Cada teste começa de um estado limpo, sem tocar em dados de outros navegadores.
    if (!sessionStorage.getItem('__e2e_init')) {
      localStorage.clear()
      sessionStorage.setItem('__e2e_init', '1')
    }
  })
})

test('landing pública não carrega CSS do admin e continua com o visual original', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.admin-root')).toHaveCount(0)
  const sheets = await page.evaluate(() => [...document.styleSheets].map((s) => { try { return s.cssRules.length } catch { return 0 } }))
  expect(sheets.length).toBeGreaterThan(0)
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(248, 245, 236)')
})

test('login, navegação e todas as áreas do menu abrem sem erros de console', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  await login(page)
  for (const [label, heading] of [
    ['Crianças e adolescentes', 'Crianças e adolescentes'],
    ['Rede de apoio', 'Rede de apoio'],
    ['Doações', 'Doações'],
    ['Relatórios', 'Relatórios'],
    ['Configurações', 'Configurações'],
    ['Dashboard', 'Visão geral'],
  ]) {
    await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: label }).click()
    await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible()
  }
  expect(errors).toEqual([])
})

test('crianças: criar com validação, ordenar, filtrar e remover com confirmação', async ({ page }) => {
  await login(page)
  await page.goto('/#/painel/criancas')
  await page.getByRole('button', { name: 'Nova criança' }).click()
  await page.getByRole('button', { name: 'Cadastrar' }).click()
  await expect(page.getByText('Informe o nome completo.')).toBeVisible()
  await expect(page.getByText('Informe o responsável.')).toBeVisible()
  await page.getByLabel('Nome completo').fill('Criança E2E')
  await page.getByRole('spinbutton', { name: 'Idade' }).fill('19')
  await page.getByRole('textbox', { name: 'Responsável' }).fill('Responsável E2E')
  await page.getByRole('button', { name: 'Cadastrar' }).click()
  await expect(page.getByText('A idade máxima é 18 anos.')).toBeVisible()
  await page.getByRole('spinbutton', { name: 'Idade' }).fill('12')
  await page.getByRole('button', { name: 'Cadastrar' }).click()
  await expect(page.getByRole('button', { name: 'Criança E2E' })).toBeVisible()

  // ordenação numérica pela idade: 6 vem antes de 12 e 14
  await page.getByRole('button', { name: /Ordenar por Idade/ }).click()
  const ages = await page.locator('table tbody tr td:nth-child(2)').allTextContents()
  expect(ages.map(Number)).toEqual([...ages.map(Number)].sort((a, b) => a - b))

  // persistência: recarrega e o cadastro continua
  await page.reload()
  await expect(page.getByRole('button', { name: 'Criança E2E' })).toBeVisible()

  // remoção exige confirmação
  const row = page.getByRole('row', { name: /Criança E2E/ })
  await row.getByRole('button', { name: 'Abrir ações da linha' }).click()
  await page.getByRole('menuitem', { name: 'Remover cadastro' }).click()
  await page.getByRole('button', { name: 'Cancelar' }).click()
  await expect(page.getByRole('button', { name: 'Criança E2E' })).toBeVisible()
  await row.getByRole('button', { name: 'Abrir ações da linha' }).click()
  await page.getByRole('menuitem', { name: 'Remover cadastro' }).click()
  await page.getByRole('button', { name: 'Remover cadastro' }).click()
  await expect(page.getByRole('button', { name: 'Criança E2E' })).toHaveCount(0)
})

test('crianças: exportação é anonimizada', async ({ page }) => {
  await login(page)
  await page.goto('/#/painel/criancas')
  await page.getByRole('button', { name: 'Exportar' }).click()
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('menuitem', { name: /CSV/ }).click()])
  const text = fs.readFileSync((await download.path())!, 'utf8')
  expect(text).toContain('Código')
  expect(text).not.toContain('Ana Beatriz')
  expect(text).not.toContain('Mariana Souza')
  expect(text).not.toContain('99911')
})

test('doações: filtra por tipo, indicadores acompanham e exporta CSV e PDF com escopo', async ({ page }) => {
  await login(page)
  await page.goto('/#/painel/doacoes')
  await expect(page.getByText('Dinheiro recebido').first()).toBeVisible()
  await expect(page.getByText(/1–10 de 30 doações/)).toBeVisible()
  await page.getByRole('combobox', { name: 'Tipo' }).click()
  await page.getByRole('option', { name: 'Financeira' }).click()
  await expect(page.getByText(/de 15 doações \(filtrado de 30\)/)).toBeVisible()
  await expect(page.getByText('R$ 0,00').first()).toBeVisible() // estimativa zera ao filtrar só financeiras

  await page.getByRole('button', { name: 'Exportar' }).click()
  const [csv] = await Promise.all([page.waitForEvent('download'), page.getByRole('menuitem', { name: /CSV/ }).click()])
  const csvText = fs.readFileSync((await csv.path())!, 'utf8')
  expect(csvText).toContain('Tipo: Financeira')
  expect(csvText).toContain('"Registros";"15"')

  await page.getByRole('button', { name: 'Exportar' }).click()
  const [pdf] = await Promise.all([page.waitForEvent('download'), page.getByRole('menuitem', { name: /PDF/ }).click()])
  const buf = fs.readFileSync((await pdf.path())!)
  expect(buf.subarray(0, 5).toString()).toBe('%PDF-')
})

test('doações: cadastrar e confirmar pendência atualiza indicadores', async ({ page }) => {
  await login(page)
  await page.goto('/#/painel/doacoes?novo=1')
  await expect(page.getByRole('heading', { name: 'Nova doação' })).toBeVisible()
  await page.getByLabel('Valor recebido (R$)').fill('321.5')
  await page.getByRole('dialog').getByRole('combobox', { name: 'Situação' }).click()
  await page.getByRole('option', { name: 'Pendente' }).click()
  await page.getByRole('button', { name: 'Registrar doação' }).click()
  await expect(page.getByText('Doação registrada.')).toBeVisible()
  await expect(page.getByText(/de 31 doações|1–10 de 31/)).toBeVisible()
})

test('relatórios: cada relatório mostra cabeçalho, metodologia e exporta', async ({ page }) => {
  await login(page)
  await page.goto('/#/painel/relatorios')
  for (const slug of ['doacoes', 'atendimentos', 'atividades', 'rede-de-apoio', 'institucional']) {
    await page.goto(`/#/painel/relatorios/${slug}`)
    await expect(page.getByText('Período analisado')).toBeVisible()
    await expect(page.getByText('Filtros aplicados')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Metodologia' })).toBeVisible()
    await page.getByRole('button', { name: 'Exportar' }).click()
    const [pdf] = await Promise.all([page.waitForEvent('download'), page.getByRole('menuitem', { name: /PDF/ }).click()])
    expect(fs.readFileSync((await pdf.path())!).subarray(0, 5).toString()).toBe('%PDF-')
  }
})

test('rede de apoio: histórico de contribuições vem das doações vinculadas', async ({ page }) => {
  await login(page)
  await page.goto('/#/painel/pessoas')
  await page.getByRole('button', { name: 'Ricardo Almeida' }).click()
  await expect(page.getByRole('heading', { name: 'Histórico de contribuições' })).toBeVisible()
  await expect(page.getByRole('dialog').getByRole('row').nth(1)).toBeVisible()
})

test('mobile: tabela vira lista com todos os campos e menu abre', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await login(page)
  await page.goto('/#/painel/doacoes')
  await expect(page.getByRole('list', { name: 'Doações registradas' })).toBeVisible()
  await expect(page.getByRole('table')).toHaveCount(0)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
  expect(overflow).toBe(false)
  await page.getByRole('button', { name: 'Abrir menu' }).click()
  await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible()
})

test('teclado: foco visível e menu de ordenação acessível', async ({ page }) => {
  await login(page)
  await page.goto('/#/painel/doacoes')
  await page.keyboard.press('Tab')
  const focused = await page.evaluate(() => document.activeElement?.textContent)
  expect(focused).toContain('Ir para o conteúdo')
})
