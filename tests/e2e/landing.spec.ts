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

test('서비스 주소에서 제품을 이해하고 실제 가입으로 이동한다', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));

  await page.goto('/');

  await expect(page.getByRole('heading', { name: /집에 관한 일/ })).toBeVisible();
  await expect(page.getByRole('tab')).toHaveCount(4);
  await expect(page.getByRole('img', { name: /컴퓨터와 휴대전화에 흩어진 집 사진/ })).toBeVisible();
  await page.getByRole('tab', { name: /급하게 계약서/ }).click();
  await expect(page.getByRole('tabpanel')).toContainText('계약 만기일');
  await page.getByRole('link', { name: '웹에서 시작하기' }).first().click();
  await expect(page).toHaveURL(/\/signup$/);
  expect(browserErrors).toEqual([]);
});
