import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const viewports = [320, 390, 768, 1440] as const;
for (const width of viewports) {
  test(`TEST-RC-RESP-${width} public story carousel is usable and accessible at ${width}px`, async ({ page }) => {
    const viewportHeight = width <= 390 ? 844 : 900;
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
    await page.setViewportSize({ width, height: viewportHeight });
    await page.goto('/');

    const carousel = page.getByRole('region', { name: '집신이 필요한 네 장면' });
    await expect(carousel).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: /계약과 동시에 흩어지는 부동산 정보.*하나의 집 이력으로 가치를 키웁니다/ })).toBeVisible();

    const headlineLinesFit = await carousel.locator('h1 span').evaluateAll((lines) => (
      lines.every((line) => line.scrollWidth <= line.clientWidth + 1)
    ));
    expect(headlineLinesFit).toBe(true);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    const verticalOverflow = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    expect(verticalOverflow).toBeLessThanOrEqual(1);

    const controlButtons = carousel.getByRole('button');
    const controlCount = await controlButtons.count();
    expect(controlCount).toBe(width <= 390 ? 6 : 7);
    for (let index = 0; index < controlCount; index += 1) {
      if (!await controlButtons.nth(index).isVisible()) continue;
      const box = await controlButtons.nth(index).boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
      expect((box?.x ?? -1) + (box?.width ?? 0)).toBeLessThanOrEqual(width + 1);
      expect((box?.y ?? -1) + (box?.height ?? 0)).toBeLessThanOrEqual(viewportHeight + 1);
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
      const fitsViewport = await slide.evaluate((element) => {
        const box = element.getBoundingClientRect();
        return box.top >= -1 && box.bottom <= window.innerHeight + 1;
      });
      expect(fitsViewport).toBe(true);
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
    await page.screenshot({ path: `test-results/release-responsive-${width}.png`, fullPage: false });
  });
}

test('TEST-RC-HERO-MOTION-001 reduced motion keeps the first slide still for eight seconds', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.waitForTimeout(8000);
  await expect(page.getByText('1 / 4')).toBeVisible();
  await expect(page.getByRole('heading', { name: /계약과 동시에 흩어지는 부동산 정보/ })).toBeVisible();
});

test('TEST-PUB-SV-KAKAO-001 768px에서 카카오 문의가 캐러셀 제어를 덮지 않는다', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto('/');

  const pause = page.getByRole('button', { name: '자동 넘김 일시정지' });
  await expect(pause).toBeVisible();
  const receivesPointer = await pause.evaluate((button) => {
    const box = button.getBoundingClientRect();
    const target = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return target === button || button.contains(target);
  });
  expect(receivesPointer).toBe(true);
  await pause.click();
  await expect(page.getByRole('button', { name: '자동 넘김 재생' })).toBeVisible();
});

test('TEST-RC-HERO-SWIPE-001 mobile uses horizontal swipe but ignores a vertical gesture', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const stage = page.getByTestId('home-story-stage');

  const box = await stage.boundingBox();
  expect(box).not.toBeNull();
  const client = await page.context().newCDPSession(page);
  const startX = (box?.x ?? 0) + (box?.width ?? 0) * 0.75;
  const endX = startX - 100;
  const y = (box?.y ?? 0) + Math.min((box?.height ?? 0) * 0.35, 240);
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: startX, y }] });
  await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: endX, y }] });
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.getByRole('button', { name: '이어진다 장면 보기' })).toHaveAttribute('aria-current', 'true');

  await stage.dispatchEvent('pointerdown', { clientX: 220, clientY: 200, pointerId: 2 });
  await stage.dispatchEvent('pointerup', { clientX: 290, clientY: 310, pointerId: 2 });
  await expect(page.getByRole('button', { name: '이어진다 장면 보기' })).toHaveAttribute('aria-current', 'true');
});

test('TEST-RC-HERO-POINTER-001 real touch contact pauses autoplay', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const stage = page.getByTestId('home-story-stage');
  const box = await stage.boundingBox();
  expect(box).not.toBeNull();
  const client = await page.context().newCDPSession(page);
  const x = (box?.x ?? 0) + (box?.width ?? 0) / 2;
  const y = (box?.y ?? 0) + Math.min((box?.height ?? 0) * 0.35, 240);

  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await page.waitForTimeout(7500);
  await expect(page.getByRole('button', { name: '모인다 장면 보기' })).toHaveAttribute('aria-current', 'true');
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
});

test('TEST-PUB-SV-VIEWPORT-001 vertical wheel does not move the single-screen public home', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.mouse.wheel(0, 1200);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.getByRole('button', { name: '모인다 장면 보기' })).toHaveAttribute('aria-current', 'true');
});

test('TEST-RC-HERO-POINTER-002 releasing outside the stage restores autoplay', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const stage = page.getByTestId('home-story-stage');
  const box = await stage.boundingBox();
  expect(box).not.toBeNull();

  await page.mouse.move((box?.x ?? 0) + 100, (box?.y ?? 0) + 160);
  await page.mouse.down();
  await page.mouse.move(1, (box?.y ?? 0) + 160);
  await page.mouse.up();
  await page.waitForTimeout(9000);

  await expect(page.getByRole('button', { name: '이어진다 장면 보기' })).toHaveAttribute('aria-current', 'true');
});
