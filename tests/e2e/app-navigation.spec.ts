import { expect, test } from '@playwright/test';

test('signed-out users understand the product and can enter the real login flow', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: /집에 관한 일/ })).toBeVisible();
  await page.getByRole('link', { name: '로그인' }).first().click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: '집신 시작하기' })).toBeVisible();
  await expect(page.getByText(/사전 가입|데모/)).toHaveCount(0);
});
