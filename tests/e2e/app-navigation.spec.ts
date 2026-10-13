import { expect, test } from '@playwright/test';

test('signed-out users enter the real login flow instead of preregistration', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('heading', { name: '집신 시작하기' })).toBeVisible();
  await expect(page.getByText(/사전 가입|데모/)).toHaveCount(0);
});
