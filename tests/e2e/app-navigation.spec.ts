import { expect, test } from '@playwright/test';

test('signed-out users understand the product and can enter the real login flow', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: /집에 관한 일/ })).toBeVisible();
  await page.getByRole('link', { name: '로그인' }).first().click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: '집신 시작하기' })).toBeVisible();
  await expect(page.getByText(/사전 가입|데모/)).toHaveCount(0);
});

for (const width of [320, 390, 768, 1440]) {
  test(`Kakao inquiry stays reachable without covering the viewport at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');

    const inquiry = page.getByRole('link', { name: '카카오톡으로 집신 대표에게 문의하기 (새 창)' });
    await expect(inquiry).toBeVisible();
    await expect(inquiry).toHaveAttribute('href', 'https://pf.kakao.com/_xhcxkFX/chat');
    await expect(inquiry).toHaveAttribute('target', '_blank');
    await inquiry.focus();
    await expect(inquiry).toBeFocused();

    const position = await inquiry.evaluate((element) => getComputedStyle(element).position);
    expect(position).toBe('fixed');

    const box = await inquiry.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    expect(box!.y + box!.height).toBeLessThanOrEqual(900);
    if (width < 768) expect(900 - (box!.y + box!.height)).toBeGreaterThanOrEqual(76);

    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasHorizontalOverflow).toBe(false);
  });
}
