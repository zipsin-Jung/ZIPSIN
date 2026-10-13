import {expect, test} from '@playwright/test';

test('로그인 없이 첫 후보를 만들고 새로고침 뒤 이어서 본다', async ({page}) => {
  await page.goto('/ck');

  await expect(page.getByRole('heading', {name: /집 보면서/})).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await page.getByRole('button', {name: '바로 체크'}).click();
  await expect(page.getByRole('heading', {name: '오늘 본 집 1 체크'})).toBeVisible();
  await page.getByRole('button', {name: '물·배수 괜찮음'}).click();

  await page.reload();
  await expect(page.getByRole('heading', {name: '내가 본 집 1채'})).toBeVisible();
  await page.getByRole('button', {name: '오늘 본 집 1 위치 미입력'}).click();
  await expect(page.getByRole('heading', {name: '오늘 본 집 1 체크'})).toBeVisible();
  await expect(page.getByRole('button', {name: '물·배수 괜찮음'})).toHaveAttribute('aria-pressed', 'true');
});
