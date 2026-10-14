import { expect, test } from '@playwright/test';

test('기존 소개 페이지의 핵심 안내와 가입 이동을 유지한다', async ({ page }) => {
  await page.goto('/about');

  await expect(page.getByRole('heading', { level: 1, name: /사람이 바뀌어도,\s*집의 기록은\s*남습니다/ })).toBeVisible();
  await page.getByRole('link', { name: '사전 회원 가입 하기' }).first().click();
  await expect(page.locator('#signup')).toBeInViewport();
  await page.getByRole('link', { name: '무료로 시작하기' }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test('TEST-RC-HERO-JOURNEY-001 네 장의 제품 이야기를 확인하고 실제 가입으로 이동한다', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  const carousel = page.getByRole('region', { name: '집신이 필요한 네 장면' });
  await expect(carousel).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: /계약과 동시에 흩어지는 부동산 정보.*하나의 집 이력으로 가치를 키웁니다/ })).toBeVisible();
  await expect(page.getByRole('img', { name: /흩어진 계약서와 사진, 통화와 일정/ })).toBeVisible();

  const next = page.getByRole('button', { name: '다음 장면' });
  await next.click();
  await expect(page.getByRole('heading', { name: '사람은 바뀌어도, 집의 기록은 이어집니다.' })).toBeVisible();
  await next.click();
  await expect(page.getByRole('heading', { name: /어디서 나눈 말인지/ })).toBeVisible();
  await expect(page.getByText(/외부 연락 기록을 가져오지 않고.*집신 채팅/)).toBeVisible();

  await next.focus();
  await page.keyboard.press('End');
  await expect(page.getByRole('heading', { name: '위치와 서류만 보고 계신가요?' })).toBeVisible();
  await expect(page.getByRole('button', { name: '다음 장면' })).toBeDisabled();

  await page.keyboard.press('Home');
  await page.getByRole('link', { name: /내 집 기록 시작하기/ }).first().click();
  await expect(page).toHaveURL(/\/signup$/);
  expect(browserErrors).toEqual([]);
});

test('TEST-RC-HERO-SSR-001 JavaScript가 없어도 첫 장과 가입 경로를 제공한다', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}/`);

  await expect(page.getByRole('heading', { level: 1, name: /계약과 동시에 흩어지는 부동산 정보.*하나의 집 이력으로 가치를 키웁니다/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /내 집 기록 시작하기/ }).first()).toHaveAttribute('href', '/signup');

  await context.close();
});
