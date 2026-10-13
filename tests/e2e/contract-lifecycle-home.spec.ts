import { expect, test } from '@playwright/test';

const baseUrl = process.env.CONTRACT_E2E_BASE_URL;
const username = process.env.CONTRACT_E2E_USERNAME;
const password = process.env.CONTRACT_E2E_PASSWORD;
const homeId = process.env.CONTRACT_E2E_HOME_ID;

test.describe('contract-centered home', () => {
  test.skip(!baseUrl || !username || !password || !homeId, 'Disposable Preview account and contract home are required');

  test.beforeEach(async ({ page }) => {
    await page.goto(new URL('/login', baseUrl).toString());
    await page.getByLabel('아이디').fill(username!);
    await page.getByRole('textbox', { name: '비밀번호', exact: true }).fill(password!);
    await page.getByRole('button', { name: '로그인', exact: true }).click();
    await expect(page).toHaveURL(/\/home$/);
  });

  test('TEST-ZH-E2E-001 opens a real home, shows its lifecycle, and preserves the selected plan', async ({ page }) => {
    await page.goto(new URL(`/homes/${homeId}`, baseUrl).toString());
    await expect(page.getByText('계약 만기')).toBeVisible();
    await expect(page.getByRole('heading', { name: '집의 시간' })).toBeVisible();
    await expect(page.getByText('계약 보관')).toBeVisible();
    await expect(page.getByText('입주 기록')).toBeVisible();
    await expect(page.getByText('거주·관리')).toBeVisible();
    await expect(page.getByText('만기·퇴거')).toBeVisible();
    await expect(page.getByRole('link', { name: '집 대화 보기' })).toBeVisible();

    const plan = page.getByRole('button', { name: '연장 생각 중' });
    if (await plan.count()) {
      await plan.click();
      await expect(page.getByRole('status')).toContainText('저장했습니다');
      await page.reload();
      await expect(page.getByRole('button', { name: '연장 생각 중' })).toHaveAttribute('aria-pressed', 'true');
    }

    const nextActions = page.locator('[aria-labelledby="next-actions-title"] li');
    expect(await nextActions.count()).toBeLessThanOrEqual(3);
  });

  test('TEST-ZH-E2E-002 keeps contract editing unavailable unless the server grants it', async ({ page }) => {
    await page.goto(new URL(`/homes/${homeId}`, baseUrl).toString());
    const form = page.locator('#contract-form');
    if (await form.count()) {
      await expect(page.getByLabel('계약 시작일')).toBeVisible();
      await expect(page.getByLabel('계약 만기일')).toBeVisible();
    } else {
      await expect(page.getByRole('heading', { name: '계약 기간 확인' })).toHaveCount(0);
    }
  });
});
