import { devices, expect, test } from '@playwright/test';

test.describe('TEST-CK-INSTALL-E2E PC', () => {
  test('PC에서 앱 받기를 누르면 실제 QR과 안내가 보이고 닫으면 버튼으로 돌아온다', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/ck');
    const trigger = page.getByRole('button', { name: '집신체크 앱 받기' });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: '휴대폰에 집신체크 앱 받기' });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('[data-ready="true"] svg')).toBeVisible();
    await dialog.getByRole('button', { name: '닫기' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    expect(errors).toEqual([]);
  });

  test('집신체크 화면은 집신체크 전용 앱 정보를 쓴다', async ({ page, request }) => {
    await page.goto('/ck');
    const links = page.locator('link[rel="manifest"]');
    await expect(links).toHaveCount(1);
    await expect(links).toHaveAttribute('href', '/ck/manifest.webmanifest');
    const manifest = await (await request.get('/ck/manifest.webmanifest')).json();
    expect(manifest).toMatchObject({ short_name: '집신체크', start_url: '/ck' });
  });
});

for (const width of [320, 390]) {
  test.describe(`TEST-CK-INSTALL-E2E 휴대폰 ${width}px`, () => {
    test.use({ userAgent: devices['Pixel 7'].userAgent, hasTouch: true, isMobile: true, viewport: { width, height: 760 } });
    test('QR로 열면 홈 화면 추가 안내가 자동으로 열리고 가로로 넘치지 않는다', async ({ page }) => {
      await page.goto('/ck?install=1');
      const dialog = page.getByRole('dialog', { name: '홈 화면에 집신체크 추가하기' });
      await expect(dialog).toBeVisible();
      await expect(page).toHaveURL(/\/ck$/);
      await expect(dialog.getByRole('button', { name: '집신체크 앱 설치하기' })).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      await page.screenshot({ path: `test-results/ck-install-phone-${width}.png` });
    });
  });
}
