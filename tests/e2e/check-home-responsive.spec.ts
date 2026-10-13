import {expect, test} from '@playwright/test';

for (const viewport of [{width: 320, height: 800}, {width: 390, height: 844}]) {
  test(`홈 최근 카드와 고정 메뉴가 ${viewport.width}px에서 겹치지 않는다`, async ({page}) => {
    await page.setViewportSize(viewport);
    await page.goto('/ck');

    const recent = page.getByRole('region', {name: '최근 보러 갈 집'});
    const firstCard = recent.getByRole('button', {name: '보러 갈 집 1 등록하기'});
    await expect(recent).toBeVisible();
    await expect(firstCard).toBeVisible();

    const hasPageOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasPageOverflow).toBe(false);

    const cardBox = await firstCard.boundingBox();
    expect(cardBox).not.toBeNull();
    expect(cardBox!.x).toBeGreaterThanOrEqual(0);
    expect(cardBox!.x + cardBox!.width).toBeLessThanOrEqual(viewport.width);

    const navigation = page.getByRole('navigation', {name: '집신체크 주요 메뉴'});
    const kakao = page.getByRole('link', {name: '집신 카카오톡 채널에서 문의하기'});
    const [navigationBox, kakaoBox] = await Promise.all([
      navigation.boundingBox(),
      kakao.boundingBox(),
    ]);
    expect(navigationBox).not.toBeNull();
    expect(kakaoBox).not.toBeNull();

    const overlaps = !(
      kakaoBox!.x + kakaoBox!.width <= navigationBox!.x ||
      navigationBox!.x + navigationBox!.width <= kakaoBox!.x ||
      kakaoBox!.y + kakaoBox!.height <= navigationBox!.y ||
      navigationBox!.y + navigationBox!.height <= kakaoBox!.y
    );
    expect(overlaps).toBe(false);
  });
}
