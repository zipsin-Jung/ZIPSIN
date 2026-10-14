import { expect, test } from '@playwright/test';

for (const viewport of [
  { width: 320, height: 720 },
  { width: 390, height: 844 },
  { width: 768, height: 900 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
]) {
  test(`로그인 화면은 ${viewport.width}px에서 간편 로그인과 아이디 로그인을 제공한다`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: '집신 시작하기' })).toBeVisible();
    await expect(page.getByText(/연결 설정 후 사용할 수 있습니다/)).toHaveCount(0);
    await expect(page.getByLabel('아이디')).toBeVisible();
    await expect(page.getByRole('textbox', { name: '비밀번호', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible();
    const signupLinks = page.getByRole('link', { name: '회원가입', exact: true });
    await expect(signupLinks).toHaveCount(2);
    await expect(signupLinks.first()).toBeVisible();
    await expect(page.getByLabel('이메일 주소')).toHaveCount(0);
    const visual = page.getByRole('img', { name: '집별 계약·사진·수리·일정 기록이 이어지는 집신 화면 예시' });
    if (viewport.width <= 390) await expect(visual).toBeHidden();
    else await expect(visual).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: '집신 시작하기' })).toBeVisible();
  });

  test(`회원가입 화면은 ${viewport.width}px에서 휴대전화 인증을 같은 화면에 제공한다`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: '회원가입' })).toBeVisible();
    await expect(page.getByRole('list', { name: '회원가입 진행 단계' })).toHaveCount(0);
    await expect(page.getByLabel('휴대폰 번호')).toBeVisible();
    await expect(page.getByRole('button', { name: '인증번호 받기' })).toBeVisible();
    await expect(page.getByLabel('인증번호')).toHaveCount(0);
    await expect(page.getByText(/노트북·PC에서도 같은 집신 계정/)).toBeVisible();
    await expect(page.getByText('영문 소문자·숫자·특수문자를 포함해 8자 이상')).toBeVisible();
    await expect(page.getByRole('button', { name: '비밀번호 보기' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: '필수 항목 전체 동의' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: /만 14세/ })).toHaveCount(0);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });

  test(`집신체크 회원가입은 ${viewport.width}px에서 휴대폰 인증 뒤 복귀함을 알린다`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/signup?next=%2Fck');
    await expect(page.getByText(/가입을 마치면 집신체크로 바로 돌아가요/)).toBeVisible();
    await expect(page.getByLabel('휴대폰 번호')).toBeVisible();
    await expect(page.getByText(/문자 인증 없이 가입/)).toHaveCount(0);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });
}

test('문자 발송과 인증을 회원가입 화면에서 연속 완료한다', async ({ page }) => {
  await page.route('**/api/auth/username-availability', (route) => route.fulfill({ json: { status: 'available' } }));
  await page.route('**/api/auth/signup/phone/send', (route) => route.fulfill({
    json: { ok: true, challengeId: '11111111-1111-4111-8111-111111111111', maskedPhone: '010-****-5678' },
  }));
  await page.route('**/api/auth/signup/phone/verify', (route) => route.fulfill({ json: { ok: true } }));
  await page.goto('/signup?next=%2Fck');
  await page.waitForTimeout(300);
  await page.getByLabel('아이디').fill('new_user');
  await page.getByRole('button', { name: '아이디 중복 확인' }).click();
  await page.getByLabel('비밀번호', { exact: true }).fill('password-2026');
  await page.getByLabel('비밀번호 확인').fill('password-2026');
  await page.getByLabel('이메일').fill('new@example.com');
  await page.getByLabel('휴대폰 번호').fill('01012345678');
  await page.getByRole('button', { name: '인증번호 받기' }).click();
  await page.getByLabel('인증번호').fill('123456');
  await page.getByRole('button', { name: '인증 확인' }).click();
  await expect(page.getByText('휴대폰 인증이 완료되었습니다.')).toBeVisible();
  await page.getByRole('checkbox', { name: '필수 항목 전체 동의' }).check();
  await expect(page.getByRole('button', { name: '회원가입 완료' })).toBeEnabled();
});

test('가입 의도 쿠키는 문자 발송 API에서 생성되어 인증 API에도 전달된다', async ({ page, context }) => {
  await page.goto('/signup');
  await page.evaluate(async () => {
    await fetch('/api/auth/signup/phone/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '01012345678' }),
    });
  });
  const intent = (await context.cookies()).find((cookie) => cookie.name === 'zipsin_signup_intent');
  expect(intent).toMatchObject({ httpOnly: true, path: '/', sameSite: 'Lax' });

  const verify = await page.evaluate(async () => {
    const response = await fetch('/api/auth/signup/phone/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId: '11111111-1111-4111-8111-111111111111', code: '123456' }),
    });
    return { status: response.status, body: await response.json() as { error?: string } };
  });
  expect(verify.body.error).not.toBe('not_found');
});

test('200% 글자 확대와 키보드 이동에서도 회원가입 순서와 초점이 유지된다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/signup');
  await page.waitForTimeout(300);
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await expect(page.getByLabel('아이디')).toBeVisible();
  await expect(page.getByLabel('휴대폰 번호')).toBeVisible();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('아이디')).toBeFocused();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
