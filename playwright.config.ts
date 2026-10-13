import {defineConfig, devices} from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', {open: 'never'}]],
  use: {baseURL, screenshot: 'only-on-failure', trace: 'on-first-retry'},
  projects: [
    {name: 'chromium-desktop', use: {...devices['Desktop Chrome']}},
    {name: 'chromium-mobile-390', use: {...devices['iPhone 13'], browserName: 'chromium', viewport: {width: 390, height: 844}}},
  ],
  webServer: {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
    url: `${baseURL}/ck`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
