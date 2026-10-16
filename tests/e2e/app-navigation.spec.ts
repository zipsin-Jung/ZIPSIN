import { expect, test } from '@playwright/test';

test('signed-out users understand the product and can enter the real login flow', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: '부동산, 아직도 위치와 서류만 보고 계신가요?' })).toBeVisible();
  await page.getByRole('link', { name: '로그인' }).first().click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: '집신 시작하기' })).toBeVisible();
  await expect(page.getByText(/사전 가입|데모/)).toHaveCount(0);
});

test('public header offers install before login and web signup', async ({ page }) => {
  await page.goto('/');

  const actions = page.locator('[data-header-actions] > button, [data-header-actions] > a');
  await expect(actions).toHaveCount(3);
  await expect(actions.nth(0)).toHaveAccessibleName('앱으로 다운로드');
  await expect(actions.nth(1)).toHaveAccessibleName('로그인');
  await expect(actions.nth(2)).toHaveAccessibleName('회원가입');
  await expect(actions.nth(0)).toHaveCSS('min-height', '44px');
});

test('unsupported browser gets an honest install guide and Escape restores focus', async ({ page }) => {
  await page.addInitScript(() => {
    window.addEventListener('beforeinstallprompt', (event) => event.stopImmediatePropagation());
  });
  await page.goto('/');
  const install = page.getByRole('button', { name: '앱으로 다운로드' });

  await install.click();
  const dialog = page.getByRole('dialog', { name: '집신 앱 설치 안내' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/앱스토어 앱이 아닌 웹앱/)).toBeVisible();
  await expect(dialog.getByText(/인터넷 연결이 필요/)).toBeVisible();
  await expect(dialog.getByRole('heading', { name: '집신 앱 설치 안내' })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(install).toBeFocused();
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
