import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { replace, refresh, completeSignup } = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  completeSignup: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace, refresh }) }));
vi.mock('@/features/auth/actions/complete-signup', () => ({ completeSignup }));

import { VerificationForm } from '@/features/auth/components/VerificationForm';

describe('VerificationForm', () => {
  beforeEach(() => {
    replace.mockReset();
    refresh.mockReset();
    completeSignup.mockReset();
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ challengeId: 'challenge-1', maskedPhone: '010-****-5678' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) }));
  });

  it('집신체크 유입은 전화 인증 완료 후 원래 화면으로 돌아간다', async () => {
    completeSignup.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<VerificationForm displayName="홍길동" email="test@example.com" next="/ck" />);

    await user.type(screen.getByRole('textbox', { name: '전화번호' }), '01012345678');
    await user.click(screen.getByRole('button', { name: '인증번호 받기' }));
    await user.type(await screen.findByRole('textbox', { name: '인증번호' }), '123456');
    await user.click(screen.getByRole('button', { name: '인증하기' }));
    await user.click(screen.getByRole('checkbox', { name: /서비스 이용약관/ }));
    await user.click(screen.getByRole('checkbox', { name: /개인정보 수집/ }));
    await user.click(screen.getByRole('button', { name: '가입 완료' }));

    expect(completeSignup).toHaveBeenCalled();
    expect(screen.queryByRole('checkbox', { name: /만 14세/ })).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith('/ck');
    expect(refresh).toHaveBeenCalled();
  });

  it('TEST-ZSD-AUTH-002 explains when the SMS provider is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: 'provider_unavailable' }),
    }));
    const user = userEvent.setup();
    render(<VerificationForm displayName="홍길동" email="test@example.com" />);
    await user.type(screen.getByRole('textbox', { name: '전화번호' }), '01012345678');
    await user.click(screen.getByRole('button', { name: '인증번호 받기' }));
    expect(await screen.findByText(/문자 인증 연결을 준비하고 있습니다/)).toBeInTheDocument();
  });

  it('TEST-ZSD-AUTH-003 explains an expired verification code and lets the user request another', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ challengeId: 'challenge-1', maskedPhone: '010-****-5678' }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'expired' }) }));
    const user = userEvent.setup();
    render(<VerificationForm />);
    await user.type(screen.getByRole('textbox', { name: '전화번호' }), '01012345678');
    await user.click(screen.getByRole('button', { name: '인증번호 받기' }));
    await user.type(await screen.findByRole('textbox', { name: '인증번호' }), '123456');
    await user.click(screen.getByRole('button', { name: '인증하기' }));
    expect(await screen.findByText(/인증번호가 만료됐습니다/)).toBeInTheDocument();
  });
});
