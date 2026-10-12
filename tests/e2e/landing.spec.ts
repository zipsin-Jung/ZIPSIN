import { expect, test } from '@playwright/test';

test('기존 랜딩페이지의 핵심 안내와 가입 이동을 유지한다', async ({ page }) => {
  await page.goto('/about');

  await expect(
    page.getByRole('heading', {
      level: 1,
      name: /사람이 바뀌어도,\s*집의 기록은\s*남습니다/,
    }),
  ).toBeVisible();
  await page.getByRole('link', { name: '사전 회원 가입 하기' }).first().click();
  await expect(page.locator('#signup')).toBeInViewport();

  await page.getByRole('link', { name: '무료로 시작하기' }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test('서비스 주소는 긴 랜딩 대신 로그인으로 바로 이동한다', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: '집신 시작하기' })).toBeVisible();
});
