import { expect, test } from '@playwright/test';

const previewBaseUrl = process.env.PREVIEW_BASE_URL;
const previewUsername = process.env.PREVIEW_TEST_USERNAME;
const previewPassword = process.env.PREVIEW_TEST_PASSWORD;

test.describe('current Preview auth roundtrip', () => {
  test.skip(!previewBaseUrl, 'PREVIEW_BASE_URL is required for deployed verification');

  test('shows the public product home and opens login', async ({ page }) => {
    await page.goto(new URL('/', previewBaseUrl).toString());
    await expect(page.getByRole('heading', { level: 1, name: /집에 관한 일/ })).toBeVisible();
    await page.getByRole('link', { name: '로그인' }).first().click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: '집신 시작하기' })).toBeVisible();
  });

  test('logs in with a disposable Preview account and enters the real home', async ({ page }) => {
    test.skip(!previewUsername || !previewPassword, 'Disposable Preview credentials are required');
    await page.goto(new URL('/login', previewBaseUrl).toString());
    await page.getByLabel('아이디').fill(previewUsername!);
    await page.getByRole('textbox', { name: '비밀번호', exact: true }).fill(previewPassword!);
    await page.getByRole('button', { name: '로그인', exact: true }).click();
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByRole('heading', { name: /집을 등록하고|이 집의 기록/ })).toBeVisible();
  });
});
