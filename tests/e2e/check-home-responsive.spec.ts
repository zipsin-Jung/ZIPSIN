import {expect, test} from '@playwright/test';

for (const viewport of [{width: 320, height: 800}, {width: 390, height: 844}, {width: 768, height: 900}, {width: 1440, height: 1000}]) {
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
    await expect(kakao).toHaveCount(1);
    await expect(
      page.getByRole('link', {name: '카카오톡으로 집신 대표에게 문의하기 (새 창)'}),
    ).toHaveCount(0);
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

for (const viewport of [{width: 320, height: 800}, {width: 390, height: 844}]) {
  test(`상세 체크 안내와 시작 버튼이 ${viewport.width}px에서 깨지지 않는다`, async ({page}) => {
    await page.setViewportSize(viewport);
    await page.goto('/ck');
    const preview=page.locator('#check-preview');
    const detail=preview.getByRole('button',{name:'상세 체크 먼저 보기'});
    const memo=preview.getByRole('button',{name:'메모·사진으로 시작'});
    await expect(preview.getByText('각 항목의 상세 체크를 꼭 눌러보세요')).toBeVisible();
    await expect(detail).toBeVisible();
    await expect(memo).toBeVisible();
    for(const target of [detail,memo]){
      const box=await target.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThan(120);
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x+box!.width).toBeLessThanOrEqual(viewport.width);
    }
    const previewButtons=preview.getByRole('button',{name:/체크 시작$/});
    await expect(previewButtons).toHaveCount(3);
    for(let index=0;index<3;index++){
      const box=await previewButtons.nth(index).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThan(200);
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x+box!.width).toBeLessThanOrEqual(viewport.width);
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth)).toBe(false);
    await detail.click();
    await expect(page.getByRole('dialog',{name:'이 집 별명 정하기'})).toBeVisible();
  });
}

for (const viewport of [{width: 320, height: 800}, {width: 390, height: 844}]) {
  test(`현장 상세 체크 강조와 완료 버튼이 ${viewport.width}px에서 겹치지 않는다`, async ({page}) => {
    await page.setViewportSize(viewport);
    await page.goto('/ck');
    await page.getByRole('button',{name:'상세 체크 먼저 보기'}).click();
    await page.getByRole('textbox',{name:'집 별명',exact:true}).fill('검수 집');
    await page.getByRole('button',{name:'별명 저장하고 체크 시작'}).click();

    const detail=page.getByRole('button',{name:'물·배수 상세 체크 펼치기'});
    const finish=page.getByRole('button',{name:'뒤로가기'});
    await expect(detail).toHaveAttribute('data-attention','required');
    await expect(detail).toHaveText('상세 체크');
    await expect(finish).toBeVisible();

    for(const target of [detail,finish]){
      const box=await target.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x+box!.width).toBeLessThanOrEqual(viewport.width);
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth)).toBe(false);

    await detail.click();
    await page.getByRole('button',{name:'물·배수 상세 체크 접기'}).click();
    await page.getByRole('button',{name:'질문 체크',exact:true}).click();
    await page.getByRole('button',{name:'집 체크',exact:true}).click();
    await expect(page.getByRole('button',{name:'물·배수 상세 체크 펼치기'})).toHaveAttribute('data-attention','seen');
  });
}

test('전체 목록의 빈 상태와 모션 감소 설정을 지원한다', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto('/ck');
  await page.getByRole('button', {name: '내가 본 집'}).click();
  await expect(page.getByRole('heading', {name: '내가 본 집 0채'})).toBeVisible();
  const first = page.getByRole('button', {name: '첫 집 등록하기'});
  await expect(first).toBeVisible();
  await first.hover();
  expect(await first.evaluate(element => getComputedStyle(element).transform)).toBe('none');
});

test('데스크톱 별명 등록창은 오른쪽 패널로 열린다',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await page.goto('/ck');
  await page.getByRole('button',{name:'상세 체크 먼저 보기'}).click();
  const dialog=page.getByRole('dialog',{name:'이 집 별명 정하기'}),box=await dialog.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x+box!.width).toBeGreaterThanOrEqual(1439);
  expect(box!.height).toBeGreaterThanOrEqual(899);
});

test('모바일 별명 등록창은 아래 바텀시트로 열린다',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/ck');
  await page.getByRole('button',{name:'상세 체크 먼저 보기'}).click();
  const dialog=page.getByRole('dialog',{name:'이 집 별명 정하기'}),box=await dialog.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeLessThanOrEqual(1);
  expect(box!.y).toBeGreaterThan(300);
  expect(box!.y+box!.height).toBeGreaterThanOrEqual(843);
});

for (const viewport of [{width: 320, height: 800}, {width: 390, height: 844}]) {
  test(`전체 10채와 긴 별명이 ${viewport.width}px 고정 요소에 가리지 않는다`, async ({page}) => {
    await page.setViewportSize(viewport);
    const candidates=Array.from({length:10},(_,index)=>({
        id:`house-${index+1}`,alias:`아주 긴 사회초년생 첫 자취방 별명 ${index+1}`,
        intakeMode:'simple',depth:'quick',listing:{location:`서울시 아주 긴 동네 이름 ${index+1}`},
        terms:{},contact:{},commute:{},answers:{},archived:false,
        createdAt:new Date(Date.UTC(2026,9,13,0,index)).toISOString(),
        updatedAt:new Date(Date.UTC(2026,9,13,0,index)).toISOString(),
      }));
    await page.addInitScript((items) => {
      localStorage.setItem('zipsin-check:v2',JSON.stringify({schemaVersion:2,candidates:items,compareCandidateIds:[]}));
    }, candidates);
    await page.goto('/ck');
    await page.getByRole('button',{name:'내가 본 집'}).click();
    await expect(page.getByRole('heading',{name:'내가 본 집 10채'})).toBeVisible();
    const last=page.getByRole('button',{name:'아주 긴 사회초년생 첫 자취방 별명 1 서울시 아주 긴 동네 이름 1',exact:true});
    await last.scrollIntoViewIfNeeded();
    const [lastBox,navigationBox,kakaoBox]=await Promise.all([
      last.boundingBox(),
      page.getByRole('navigation',{name:'집신체크 주요 메뉴'}).boundingBox(),
      page.getByRole('link',{name:'집신 카카오톡 채널에서 문의하기'}).boundingBox(),
    ]);
    expect(lastBox).not.toBeNull();
    expect(navigationBox).not.toBeNull();
    expect(kakaoBox).not.toBeNull();
    expect(lastBox!.y+lastBox!.height).toBeLessThanOrEqual(navigationBox!.y);
    expect(lastBox!.y+lastBox!.height).toBeLessThanOrEqual(kakaoBox!.y);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth)).toBe(false);
  });
}
