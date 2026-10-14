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
    await expect(page.getByRole('heading', { level: 1, name: '부동산, 아직도 위치와 서류만 보고 계신가요?' })).toBeVisible();

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
    const firstSlide = stage.getByRole('group', { name: /살펴본다/ });
    const foreground = firstSlide.locator('[data-story-foreground]');
    await expect(foreground).toBeVisible();
    const foregroundBox = await foreground.boundingBox();
    const stageBox = await stage.boundingBox();
    expect(foregroundBox).not.toBeNull();
    expect(stageBox).not.toBeNull();
    expect(foregroundBox!.x).toBeGreaterThanOrEqual(-1);
    expect(foregroundBox!.x + foregroundBox!.width).toBeLessThanOrEqual(width + 1);
    expect(foregroundBox!.width).toBeGreaterThanOrEqual(stageBox!.width * (width <= 900 ? 0.65 : 0.35));
    expect(foregroundBox!.height).toBeGreaterThanOrEqual(stageBox!.height * (width <= 900 ? 0.3 : 0.72));
    const firstImageFit = await foreground.evaluate((element) => ({
      fit: getComputedStyle(element).objectFit,
      position: getComputedStyle(element).objectPosition,
    }));
    if (width <= 390) {
      expect(firstImageFit.fit).toBe('cover');
      expect(firstImageFit.position).toBe('68% 50%');
    }

    for (const title of ['살펴본다', '정리한다', '모은다', '이어간다']) {
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

    const focusTarget = page.getByRole('button', { name: '살펴본다 장면 보기' });
    await focusTarget.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    const focusOutline = await focusTarget.evaluate((element) => getComputedStyle(element).outlineStyle);
    expect(focusOutline).not.toBe('none');

    const primary = page.getByRole('link', { name: /내 집 기록 시작하기|웹에서 시작하기/ }).first();
    const primaryBox = await primary.boundingBox();
    expect(primaryBox?.height ?? 0).toBeGreaterThanOrEqual(44);

    const installButton = page.getByRole('button', { name: '앱으로 다운로드' });
    const installBox = await installButton.boundingBox();
    expect(installBox?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect((installBox?.x ?? -1) + (installBox?.width ?? 0)).toBeLessThanOrEqual(width + 1);

    const accessibility = await new AxeBuilder({ page }).analyze();
    expect(accessibility.violations).toEqual([]);
    await page.waitForTimeout(500);
    const layoutShift = await page.evaluate(() => (window as Window & { __zipsinLayoutShift?: number }).__zipsinLayoutShift ?? 0);
    expect(layoutShift).toBeLessThanOrEqual(0.1);
    expect(browserErrors).toEqual([]);
    await page.screenshot({ path: `test-results/release-responsive-${width}.png`, fullPage: false });
  });
}

for (const width of viewports) {
  test(`TEST-PUB-ANIM-CROP-${width} gather motion moves from scattered records into the enlarged house UI`, async ({ page }) => {
    const viewportHeight = width <= 390 ? 844 : 900;
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width, height: viewportHeight });
    await page.goto('/');

    await page.getByRole('button', { name: '모은다 장면 보기' }).click();
    const gatherSlide = page.locator('[data-story="gather"]');
    const foreground = gatherSlide.locator('[data-story-foreground]');
    await expect(foreground).toBeVisible();
    await page.waitForTimeout(350);
    const startPosition = await foreground.evaluate((element) => getComputedStyle(element).objectPosition);
    const animationName = await foreground.evaluate((element) => getComputedStyle(element).animationName);
    expect(animationName).toContain('gatherFocusIntoHouse');
    expect(startPosition).not.toBe('50% 91%');
    await page.screenshot({ path: `test-results/release-motion-start-${width}.png`, fullPage: false });

    await page.waitForTimeout(3300);
    const endPosition = await foreground.evaluate((element) => getComputedStyle(element).objectPosition);
    expect(endPosition).toBe('50% 91%');
    const frame = gatherSlide.locator('[class*="storyImagePortrait"]');
    const frameBox = await frame.boundingBox();
    if (width === 768) expect(frameBox?.width ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(521);
    await page.screenshot({ path: `test-results/release-motion-complete-${width}.png`, fullPage: false });
  });
}

test('TEST-PUB-IMAGE-LAZY-001 initial load does not fetch inactive raw story backgrounds', async ({ page }) => {
  const rawStoryRequests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (/\/images\/public-home\/story-0[1-4].*\.png$/.test(url.pathname)) rawStoryRequests.push(url.pathname);
  });

  await page.goto('/');
  await page.waitForTimeout(1000);

  expect(new Set(rawStoryRequests)).toEqual(new Set(['/images/public-home/story-04-home-history.png']));
});

test('TEST-PUB-ANIM-REDUCE-001 reduced motion keeps the first slide and every image motion still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const activeSlide = page.locator('[data-active="true"]');
  const animatedParts = activeSlide.locator('[data-story-foreground], [data-story-backdrop], span');
  const animationNames = await animatedParts.evaluateAll((elements) => elements.map((element) => getComputedStyle(element).animationName));
  expect(animationNames.every((name) => name === 'none')).toBe(true);
  await page.waitForTimeout(8000);
  await expect(page.getByText('1 / 4')).toBeVisible();
  await expect(page.getByRole('heading', { name: '부동산, 아직도 위치와 서류만 보고 계신가요?' })).toBeVisible();
  await page.screenshot({ path: 'test-results/release-reduced-motion.png', fullPage: false });
});

test('200% 확대에 가까운 낮은 화면에서도 문서가 넘치지 않고 CTA에 접근한다', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 720, height: 600 });
  await page.goto('/');

  const cta = page.getByRole('link', { name: /내 집 기록 시작하기/ }).first();
  await cta.scrollIntoViewIfNeeded();
  await expect(cta).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  expect(await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)).toBeLessThanOrEqual(1);
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
  await expect(page.getByRole('button', { name: '정리한다 장면 보기' })).toHaveAttribute('aria-current', 'true');

  await stage.dispatchEvent('pointerdown', { clientX: 220, clientY: 200, pointerId: 2 });
  await stage.dispatchEvent('pointerup', { clientX: 290, clientY: 310, pointerId: 2 });
  await expect(page.getByRole('button', { name: '정리한다 장면 보기' })).toHaveAttribute('aria-current', 'true');
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
  await expect(page.getByRole('button', { name: '살펴본다 장면 보기' })).toHaveAttribute('aria-current', 'true');
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
});

test('TEST-PUB-SV-VIEWPORT-001 vertical wheel does not move the single-screen public home', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.mouse.wheel(0, 1200);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.getByRole('button', { name: '살펴본다 장면 보기' })).toHaveAttribute('aria-current', 'true');
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

  await expect(page.getByRole('button', { name: '정리한다 장면 보기' })).toHaveAttribute('aria-current', 'true');
});
