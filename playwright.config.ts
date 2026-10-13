import { defineConfig, devices } from '@playwright/test';

const playwrightPort = process.env.PLAYWRIGHT_PORT ?? '3000';
const baseURL = `http://127.0.0.1:${playwrightPort}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${playwrightPort}`,
    url: `${baseURL}/login`,
    reuseExistingServer: !process.env.CI,
  },
});
