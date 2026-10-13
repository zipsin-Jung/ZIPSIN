import { expect, test } from '@playwright/test';

test('로그인하지 않은 사용자는 집 ID를 알아도 집 기록을 열 수 없다', async ({ page }) => {
  await page.goto('/homes/00000000-0000-4000-8000-000000000001');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: '집신 시작하기' })).toBeVisible();
  await expect(page.getByText('담당자 관리')).toHaveCount(0);
});
