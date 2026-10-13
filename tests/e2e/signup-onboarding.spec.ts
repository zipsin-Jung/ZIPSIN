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
    await expect(page.getByRole('button', { name: /Google로 계속하기/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /카카오로 계속하기/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /네이버로 계속하기/ })).toBeVisible();
    await expect(page.getByLabel('아이디')).toBeVisible();
    await expect(page.getByRole('textbox', { name: '비밀번호', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible();
    const signupLinks = page.getByRole('link', { name: '회원가입', exact: true });
    await expect(signupLinks).toHaveCount(2);
    await expect(signupLinks.first()).toBeVisible();
    await expect(page.getByLabel('이메일 주소')).toHaveCount(0);
    await expect(page.getByText('계약·입주 기록')).toBeVisible();
    await expect(page.getByText('수리·사진 보관')).toBeVisible();
    await expect(page.getByText('일정·비용 관리')).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: '집신 시작하기' })).toBeVisible();
  });

  test(`회원가입 화면은 ${viewport.width}px에서 휴대전화 인증과 PC 이용을 미리 알린다`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: '회원가입' })).toBeVisible();
    await expect(page.getByRole('list', { name: '회원가입 진행 단계' })).toContainText('휴대전화 인증');
    await expect(page.getByText(/노트북·PC에서도 같은 계정/)).toBeVisible();
    await expect(page.getByText('영문 소문자·숫자·특수문자를 포함해 8자 이상')).toBeVisible();
    await expect(page.getByRole('button', { name: '비밀번호 보기' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: '필수 항목 전체 동의' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: /만 14세/ })).toHaveCount(0);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });
}
