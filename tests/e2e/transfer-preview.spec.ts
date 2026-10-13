import {expect,test} from '@playwright/test';

test('로컬 후보를 미리보고 취소해도 원본이 남는다',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('zipsin-check:v2',JSON.stringify({schemaVersion:2,activeCandidateId:'c1',compareCandidateIds:['c1'],candidates:[{id:'c1',alias:'첫 자취방',intakeMode:'simple',depth:'quick',listing:{location:'성수동'},terms:{monthlyRentWon:700000},contact:{},commute:{},answers:{'water-drain':{status:'confirmed',source:'observed'}},archived:false,createdAt:'2026-10-13T00:00:00.000Z',updatedAt:'2026-10-13T00:00:00.000Z'}]})));
  await page.goto('/ck/transfer?candidate=c1');
  await expect(page.getByRole('heading',{name:'옮길 기록을 확인해 주세요.'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'첫 자취방'})).toBeVisible();
  await expect(page.getByText(/현재는 나만 볼 수 있어요/)).toBeVisible();
  await page.getByRole('link',{name:'나중에'}).click();
  await expect(page.getByRole('button',{name:'최근 집 열기: 첫 자취방'})).toBeVisible();
});

test('사회초년생이 집신 공용 계정 화면에서 가입하고 후보 이전으로 돌아간다',async({page})=>{
  await page.goto('/login?next=%2Fck%2Ftransfer%3Fcandidate%3Dc1');
  await expect(page.getByRole('heading',{name:'집신 시작하기'})).toBeVisible();
  await expect(page.getByRole('button',{name:/Google로 계속하기/})).toBeVisible();
  await expect(page.getByRole('button',{name:/카카오로 계속하기/})).toBeVisible();
  const signup=page.getByRole('link',{name:'회원가입',exact:true}).first();
  await expect(signup).toHaveAttribute('href','/signup?next=%2Fck%2Ftransfer%3Fcandidate%3Dc1');
  await signup.click();
  await expect(page.locator('input[name="next"]')).toHaveValue('/ck/transfer?candidate=c1');
});

test('일반 가입과 특정 후보 이전의 동의 범위를 분리한다',async({page})=>{
  await page.goto('/onboarding/tenant?returnTo=%2Fck');
  await expect(page.getByRole('checkbox',{name:/선택한 후보 기록을/})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'가입 완료하고 집신체크로'})).toBeVisible();

  await page.goto('/onboarding/tenant?returnTo=%2Fck%2Ftransfer%3Fcandidate%3Dcandidate-1');
  await expect(page.getByRole('checkbox',{name:/선택한 후보 기록을/})).toBeVisible();
  await expect(page.getByRole('button',{name:'확인하고 계속'})).toBeVisible();
});
