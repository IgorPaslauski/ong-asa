import { defineConfig } from '@playwright/test'

/**
 * Testes funcionais do admin. Usam o Edge/Chrome instalado no sistema
 * (channel), então não é preciso baixar navegadores do Playwright.
 *   npm run build && npx playwright test
 * Defina PW_CHANNEL=chrome para usar o Chrome.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    channel: process.env.PW_CHANNEL ?? 'msedge',
    viewport: { width: 1440, height: 900 },
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    acceptDownloads: true,
  },
  webServer: {
    command: 'npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
