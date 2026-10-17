import { afterEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import AuthLayout from '@/app/(auth)/layout';

describe('인증 화면 묶음 레이아웃', () => {
  afterEach(() => { process.env.NEXT_PUBLIC_ACCOUNT_OPEN = 'true'; });

  it('TEST-PREP-007 닫혀 있으면 로그인·가입·찾기 화면 대신 준비 중 카드와 집신체크 링크를 보여준다', () => {
    process.env.NEXT_PUBLIC_ACCOUNT_OPEN = '';
    render(<AuthLayout><p>로그인 폼</p></AuthLayout>);
    expect(screen.queryByText('로그인 폼')).toBeNull();
    expect(screen.getByRole('heading', { name: '로그인 · 회원가입 준비 중' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '집신체크 바로 쓰기' })).toHaveAttribute('href', '/ck');
  });

  it('TEST-PREP-008 열려 있으면 원래 화면을 그대로 보여준다', () => {
    process.env.NEXT_PUBLIC_ACCOUNT_OPEN = 'true';
    render(<AuthLayout><p>로그인 폼</p></AuthLayout>);
    expect(screen.getByText('로그인 폼')).toBeInTheDocument();
  });
});
