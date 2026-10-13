import { expect, test } from '@playwright/test';

const baseUrl = process.env.SUPPORT_E2E_BASE_URL;
test.describe('official support conversation', () => {
  test.skip(!baseUrl, 'SUPPORT_E2E_BASE_URL and authenticated user/representative states are required');
  test('shows the privacy warning and official identity', async ({ page }) => {
    await page.goto(new URL('/support', baseUrl).toString());
    await expect(page.getByText('집신 고객지원')).toBeVisible();
    await expect(page.getByText(/주민등록번호|계좌 비밀번호/)).toBeVisible();
  });
});
