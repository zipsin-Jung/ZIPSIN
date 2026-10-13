import { expect, test } from '@playwright/test';

const baseUrl = process.env.LAUNCH_E2E_BASE_URL;

test.describe('launch happy path', () => {
  test.skip(!baseUrl, 'LAUNCH_E2E_BASE_URL and prepared test accounts are required');

  test('moves from home to a house, record, chat, and official support', async ({ page }) => {
    await page.goto(new URL('/home', baseUrl).toString());
    const homeLink = page.getByRole('link', { name: /열기|집신아파트|성수동 집/ }).first();
    await expect(homeLink).toBeVisible();
    await homeLink.click();
    await expect(page.getByRole('heading', { name: '집의 시간' })).toBeVisible();
    await page.getByRole('link', { name: '집 대화 보기' }).click();
    await expect(page.getByRole('textbox', { name: '메시지' })).toBeVisible();
    await page.goto(new URL('/support', baseUrl).toString());
    await expect(page.getByText('집신 고객지원')).toBeVisible();
  });
});
