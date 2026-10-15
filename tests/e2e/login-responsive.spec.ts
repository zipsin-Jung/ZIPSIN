import { expect, test } from '@playwright/test';

for (const width of [320, 390, 768, 1440]) {
  test(`login card stays usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/login?next=%2Fck');

    await expect(page.getByLabel('아이디 · 이메일 · 전화번호')).toBeVisible();
    await expect(page.getByLabel('비밀번호', { exact: true })).toBeVisible();
    await expect(page.getByLabel('로그인 유지')).toBeChecked();
    await expect(page.getByRole('link', { name: '회원가입' })).toHaveAttribute('href', '/signup?next=%2Fck');
    await expect(page.getByRole('link', { name: '체험하기' })).toHaveAttribute('href', '/ck');

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });
}
