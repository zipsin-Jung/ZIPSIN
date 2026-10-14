import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const viewports = [320, 390, 768, 1440] as const;
const MAX_TRAILING_SPACE_PX = 40;

for (const width of viewports) {
  test(`TEST-RC-RESP-${width} public story carousel is usable and accessible at ${width}px`, async ({ page }) => {
    const browserErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') browserErrors.push(message.text());
    });
    page.on('pageerror', (error) => browserErrors.push(error.message));
    await page.addInitScript(() => {
      (window as Window & { __zipsinLayoutShift?: number }).__zipsinLayoutShift = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as Array<PerformanceEntry & { hadRecentInput?: boolean; value?: number }>) {
          if (!entry.hadRecentInput) {
            (window as Window & { __zipsinLayoutShift?: number }).__zipsinLayoutShift! += entry.value ?? 0;
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width, height: width <= 390 ? 844 : 900 });
    await page.goto('/');

    const carousel = page.getByRole('region', { name: '집신이 필요한 네 장면' });
    await expect(carousel).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: '집에 관한 모든 일, 이제 집신으로.' })).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);

    const controlButtons = carousel.getByRole('button');
    const controlCount = await controlButtons.count();
    expect(controlCount).toBe(7);
    for (let index = 0; index < controlCount; index += 1) {
      const box = await controlButtons.nth(index).boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
    }

    const stage = page.getByTestId('home-story-stage');
    for (const title of ['모인다', '이어진다', '연결된다', '가치가 된다']) {
      await page.getByRole('button', { name: `${title} 장면 보기` }).click();
      const slide = stage.getByRole('group', { name: new RegExp(title) });
      await expect.poll(async () => {
        const stageBox = await stage.boundingBox();
        const slideBox = await slide.boundingBox();
        return Math.abs((stageBox?.height ?? 0) - (slideBox?.height ?? 0));
      }).toBeLessThanOrEqual(2);
      const blankAfterContent = await slide.evaluate((element) => {
        const slideBox = element.getBoundingClientRect();
        const childBottom = Math.max(...Array.from(element.children).map((child) => child.getBoundingClientRect().bottom));
        return slideBox.bottom - childBottom;
      });
      expect(blankAfterContent).toBeLessThanOrEqual(MAX_TRAILING_SPACE_PX);
    }

    const focusTarget = page.getByRole('button', { name: '모인다 장면 보기' });
    await focusTarget.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    const focusOutline = await focusTarget.evaluate((element) => getComputedStyle(element).outlineStyle);
    expect(focusOutline).not.toBe('none');

    const primary = page.getByRole('link', { name: /내 집 기록 시작하기|웹에서 시작하기/ }).first();
    const primaryBox = await primary.boundingBox();
    expect(primaryBox?.height ?? 0).toBeGreaterThanOrEqual(44);

    const accessibility = await new AxeBuilder({ page }).analyze();
    expect(accessibility.violations).toEqual([]);
    await page.waitForTimeout(500);
    const layoutShift = await page.evaluate(() => (window as Window & { __zipsinLayoutShift?: number }).__zipsinLayoutShift ?? 0);
    expect(layoutShift).toBeLessThanOrEqual(0.1);
    expect(browserErrors).toEqual([]);
    await page.screenshot({ path: `test-results/release-responsive-${width}.png`, fullPage: true });
  });
}

test('TEST-RC-HERO-MOTION-001 reduced motion keeps the first slide still for eight seconds', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.waitForTimeout(8000);
  await expect(page.getByText('1 / 4')).toBeVisible();
  await expect(page.getByRole('button', { name: '자동 넘김 재생' })).toBeDisabled();
});

test('TEST-RC-HERO-SWIPE-001 mobile uses horizontal swipe but ignores a vertical gesture', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const stage = page.getByTestId('home-story-stage');

  await stage.dispatchEvent('pointerdown', { clientX: 300, clientY: 200, pointerId: 1 });
  await stage.dispatchEvent('pointerup', { clientX: 220, clientY: 210, pointerId: 1 });
  await expect(page.getByRole('button', { name: '이어진다 장면 보기' })).toHaveAttribute('aria-current', 'true');

  await stage.dispatchEvent('pointerdown', { clientX: 220, clientY: 200, pointerId: 2 });
  await stage.dispatchEvent('pointerup', { clientX: 290, clientY: 310, pointerId: 2 });
  await expect(page.getByRole('button', { name: '이어진다 장면 보기' })).toHaveAttribute('aria-current', 'true');
});
