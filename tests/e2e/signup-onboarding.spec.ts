import { expect, test } from '@playwright/test';

for (const viewport of [
  { width: 320, height: 720 },
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
]) {
  test(`로그인 화면은 ${viewport.width}px에서 세 제공자 상태를 설명한다`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: '간편하게 시작하세요' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Google로 계속하기 준비 중' })).toBeDisabled();
    await page.reload();
    await expect(page.getByRole('heading', { name: '간편하게 시작하세요' })).toBeVisible();
  });
}
