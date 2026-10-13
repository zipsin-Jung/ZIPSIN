import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const viewports = [320, 390, 768, 1440] as const;

for (const width of viewports) {
  test(`TEST-RC-RESP-${width} public product home is usable and accessible at ${width}px`, async ({ page }) => {
    const browserErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') browserErrors.push(message.text());
    });
    page.on('pageerror', (error) => browserErrors.push(error.message));
    await page.setViewportSize({ width, height: width <= 390 ? 844 : 900 });
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: /집에 관한 일/ })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);

    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(6);
    await tabs.first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(1)).toBeFocused();
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    const focusOutline = await tabs.nth(1).evaluate((element) => getComputedStyle(element).outlineStyle);
    expect(focusOutline).not.toBe('none');

    const primary = page.getByRole('link', { name: /웹에서 시작하기/ }).first();
    const box = await primary.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);

    const accessibility = await new AxeBuilder({ page }).analyze();
    expect(accessibility.violations).toEqual([]);
    expect(browserErrors).toEqual([]);
    await page.screenshot({ path: `test-results/release-responsive-${width}.png`, fullPage: true });
  });
}
