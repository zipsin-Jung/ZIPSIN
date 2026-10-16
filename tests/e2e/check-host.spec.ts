import { expect, test } from '@playwright/test';

// Simulates ck.zipsin.net locally: run with
// NEXT_PUBLIC_CHECK_SITE_URL=http://ck.localhost:<PLAYWRIGHT_PORT>
const checkSite = process.env.NEXT_PUBLIC_CHECK_SITE_URL;
test.skip(!checkSite?.includes('ck.localhost'), 'NEXT_PUBLIC_CHECK_SITE_URL=http://ck.localhost:<port> 필요');

test('TEST-CK-HOST-005 집신체크 주소 첫 화면은 같은 주소의 집신체크를 오류 없이 보여준다', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${checkSite}/`);
  await expect(page).toHaveURL(`${checkSite}/ck`);
  await expect(page.getByRole('heading', { name: /내가 본 집.*카드처럼 비교해요/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: /내가 본 집.*카드처럼 비교해요/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test('TEST-CK-HOST-006 집신체크 주소에서 만든 기록은 로그인 화면을 거쳐도 같은 주소에 남는다', async ({ page }) => {
  await page.goto(`${checkSite}/`);
  await page.getByRole('button', { name: '바로 체크' }).click();
  await page.getByRole('textbox', { name: '집 별명', exact: true }).fill('성수역 햇살집');
  await page.getByRole('button', { name: '별명 저장하고 체크 시작' }).click();
  await expect(page.getByRole('heading', { name: '성수역 햇살집 체크' })).toBeVisible();

  await page.goto(`${checkSite}/`);
  await page.getByRole('link', { name: '로그인 / 회원가입' }).click();
  await expect(page).toHaveURL(`${checkSite}/login?next=%2Fck`);
  await expect(page.getByRole('heading', { name: '집신 시작하기' })).toBeVisible();

  await page.goBack();
  await expect(page.getByRole('button', { name: '최근 집 열기: 성수역 햇살집' })).toBeVisible();
});

test('TEST-CK-HOST-007 집신 본 주소 첫 화면은 그대로 집신 첫 화면이다', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /내가 본 집.*카드처럼 비교해요/ })).toHaveCount(0);
});
