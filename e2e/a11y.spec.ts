import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const ROUTES = ['visao-geral', 'criancas', 'pessoas', 'doacoes', 'eventos', 'relatorios', 'relatorios/doacoes', 'relatorios/atendimentos', 'relatorios/atividades', 'relatorios/rede-de-apoio', 'relatorios/institucional', 'configuracoes']

test.describe('acessibilidade (axe, WCAG 2.x A/AA)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      if (!sessionStorage.getItem('__init')) {
        localStorage.clear()
        sessionStorage.setItem('__init', '1')
      }
    })
    await page.goto('/#/sistema')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await page.waitForURL(/visao-geral/)
  })

  for (const route of ROUTES) {
    test(`/painel/${route}`, async ({ page }) => {
      await page.goto(`/#/painel/${route}`)
      await page.waitForTimeout(800)
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
      const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} — ${v.nodes.map((n) => n.target.join(" ") + " :: " + (n.html || "").slice(0, 110)).join(" | ")}`)
      expect(summary).toEqual([])
    })
  }
})
