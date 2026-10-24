import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.SHOP_PORT ?? 13100);
const baseURL = process.env.BASE_URL ?? `http://localhost:${port}`;

export default defineConfig({
  testDir: 'tests/e2e',
  // Les tests partagent l'état en mémoire de la boutique : exécution séquentielle,
  // chaque test repart du jeu de données de référence (voir fixtures.ts).
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/playwright/html', open: 'never' }],
    ['json', { outputFile: 'reports/playwright/results.json' }],
    ['junit', { outputFile: 'reports/playwright/junit.xml' }],
  ],
  use: {
    baseURL,
    locale: 'fr-FR',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && node shop-demo/dist/server.js',
    url: `${baseURL}/api/health`,
    reuseExistingServer: true,
    timeout: 60_000,
    env: {
      PORT: String(port),
      ADMIN_TOKEN: process.env.ADMIN_TOKEN ?? 'demo-admin-token-local',
      ENABLE_TEST_RESET: 'true',
    },
  },
});
