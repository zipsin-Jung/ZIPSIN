import {expect,test} from '@playwright/test';

test('로컬 후보를 미리보고 취소해도 원본이 남는다',async({page})=>{
  await page.goto('/ck');
  await page.evaluate(()=>localStorage.setItem('zipsin-check:v2',JSON.stringify({schemaVersion:2,activeCandidateId:'c1',compareCandidateIds:['c1'],candidates:[{id:'c1',alias:'첫 자취방',intakeMode:'simple',depth:'quick',listing:{location:'성수동'},terms:{monthlyRentWon:700000},contact:{},commute:{},answers:{'water-drain':{status:'confirmed',source:'observed'}},archived:false,createdAt:'2026-10-13T00:00:00.000Z',updatedAt:'2026-10-13T00:00:00.000Z'}]})));
  await page.goto('/ck/transfer?candidate=c1');
  await expect(page.getByRole('heading',{name:'옮길 기록을 확인해 주세요.'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'첫 자취방'})).toBeVisible();
  await expect(page.getByText(/현재는 나만 볼 수 있어요/)).toBeVisible();
  await page.getByRole('link',{name:'나중에'}).click();
  await expect(page.getByRole('heading',{name:'내가 본 집 1채'})).toBeVisible();
});

test('미설정 로그인 공급자는 준비 중으로 안전하게 보인다',async({page})=>{
  await page.goto('/login?returnTo=%2Fck%2Ftransfer');
  await expect(page.getByRole('heading',{name:'보고 온 집을 안전하게 이어보세요.'})).toBeVisible();
  await expect(page.getByRole('button',{name:/Google.*준비 중/})).toBeDisabled();
  await expect(page.getByRole('button',{name:/Kakao.*준비 중/})).toBeDisabled();
  await expect(page.getByRole('button',{name:/Naver.*준비 중/})).toBeDisabled();
});
