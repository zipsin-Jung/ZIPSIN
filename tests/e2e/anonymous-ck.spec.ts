import {expect, test} from '@playwright/test';

test('로그인 없이 첫 후보를 만들고 새로고침 뒤 이어서 본다', async ({page}) => {
  await page.goto('/ck');

  await expect(page.getByRole('heading', {name: /내가 본 집.*카드처럼 비교해요/})).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await page.getByRole('button', {name: '바로 체크'}).click();
  await expect(page.getByRole('dialog', {name: '이 집 별명 정하기'})).toBeVisible();
  await page.getByRole('textbox', {name: '집 별명', exact: true}).fill('성수역 햇살집');
  await page.getByRole('button', {name: '별명 저장하고 체크 시작'}).click();
  await expect(page.getByRole('heading', {name: '성수역 햇살집 체크'})).toBeVisible();
  await page.getByRole('button', {name: '물·배수 괜찮음'}).click();

  await page.reload();
  await expect(page.getByRole('button', {name: '최근 집 열기: 성수역 햇살집'})).toBeVisible();
  await page.getByRole('button', {name: '내가 본 집'}).click();
  await expect(page.getByRole('heading', {name: '내가 본 집 1채'})).toBeVisible();
  await page.getByRole('button', {name: '성수역 햇살집 위치 미입력'}).click();
  await expect(page.getByRole('heading', {name: '성수역 햇살집 체크'})).toBeVisible();
  await expect(page.getByRole('button', {name: '물·배수 괜찮음'})).toHaveAttribute('aria-pressed', 'true');
});

test('집신체크에서 하나의 집신 계정 로그인과 회원가입으로 이어진다', async ({ page }) => {
  await page.goto('/ck');
  await page.getByRole('link', { name: '간편 로그인·회원가입' }).click();

  await expect(page).toHaveURL(/\/login\?next=%2Fck$/);
  await expect(page.getByRole('heading', { name: '집신 시작하기' })).toBeVisible();

  const signup = page.getByRole('link', { name: '회원가입', exact: true }).first();
  await expect(signup).toHaveAttribute('href', '/signup?next=%2Fck');
  await signup.click();

  await expect(page).toHaveURL(/\/signup\?next=%2Fck$/);
  await expect(page.getByRole('heading', { name: '회원가입' })).toBeVisible();
  await expect(page.locator('input[name="next"]')).toHaveValue('/ck');
  await expect(page.getByRole('link', { name: '로그인' })).toHaveAttribute('href', '/login?next=%2Fck');
});
