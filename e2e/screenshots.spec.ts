import { test, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Gera as capturas de tela de validação em docs/screenshots/<largura>/.
 *   npx playwright test e2e/screenshots.spec.ts
 */
const WIDTHS = [390, 768, 1366, 1440, 1920]
const PAGES: [string, string][] = [
  ['dashboard', '/#/painel/visao-geral'],
  ['criancas', '/#/painel/criancas'],
  ['rede-de-apoio', '/#/painel/pessoas'],
  ['doacoes', '/#/painel/doacoes'],
  ['relatorios', '/#/painel/relatorios'],
  ['relatorio-doacoes', '/#/painel/relatorios/doacoes'],
  ['relatorio-atendimentos', '/#/painel/relatorios/atendimentos'],
  ['configuracoes', '/#/painel/configuracoes'],
]

async function login(page: Page) {
  await page.goto('/#/sistema')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.waitForURL(/visao-geral/)
}

for (const width of WIDTHS) {
  test(`capturas ${width}px`, async ({ page }) => {
    const dir = path.join('docs', 'screenshots', String(width))
    fs.mkdirSync(dir, { recursive: true })
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 })
    await page.addInitScript(() => {
      if (!sessionStorage.getItem('__init')) {
        localStorage.clear()
        sessionStorage.setItem('__init', '1')
      }
    })
    await page.goto('/#/sistema')
    await page.screenshot({ path: path.join(dir, 'login.png') })
    await login(page)
    for (const [name, url] of PAGES) {
      await page.goto(url)
      await page.waitForTimeout(700)
      await page.screenshot({ path: path.join(dir, `${name}.png`), fullPage: true })
    }
    await page.goto('/#/painel/doacoes?novo=1')
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(dir, 'formulario-doacao.png') })
  })
}
