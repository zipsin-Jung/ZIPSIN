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
  await expect(page.getByRole('heading', { level: 1, name: '부동산, 아직도 위치와 서류만 보고 계신가요?' })).toBeVisible();
  await expect(page.getByRole('img', { name: /에어컨과 배관, 난방과 마감의 관리 이력/ })).toBeVisible();
  await expect(page.locator('[data-active="true"]')).toHaveAttribute('data-motion-story', 'history');

  const next = page.getByRole('button', { name: '다음 장면' });
  await next.click();
  await expect(page.getByRole('heading', { name: '어디서 나눈 말인지, 누구의 집인지 헤매지 않도록.' })).toBeVisible();
  await expect(page.locator('[data-active="true"]')).toHaveAttribute('data-motion-story', 'communication');
  await next.click();
  await expect(page.getByRole('heading', { name: '부동산의 모든 정보를 집 한 채에 모아서.' })).toBeVisible();
  await expect(page.locator('[data-active="true"]')).toHaveAttribute('data-motion-story', 'gather');
  await expect(page.getByText(/계약서·사진·대화·일정을 흩어 두지 않고/)).toBeVisible();

  await next.focus();
  await page.keyboard.press('End');
  await expect(page.getByRole('heading', { name: '사람이 바뀌어도, 집의 기록은 남도록.' })).toBeVisible();
  await expect(page.locator('[data-active="true"]')).toHaveAttribute('data-motion-story', 'continuity');
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

  await expect(page.getByRole('heading', { level: 1, name: '부동산, 아직도 위치와 서류만 보고 계신가요?' })).toBeVisible();
  await expect(page.getByRole('link', { name: /내 집 기록 시작하기/ }).first()).toHaveAttribute('href', '/signup');

  await context.close();
});
