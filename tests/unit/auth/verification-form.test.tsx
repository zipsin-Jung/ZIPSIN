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

  it('전화 인증과 필수 동의 저장 후 역할 선택으로 이동한다', async () => {
    completeSignup.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<VerificationForm displayName="홍길동" email="test@example.com" />);

    await user.type(screen.getByRole('textbox', { name: '전화번호' }), '01012345678');
    await user.click(screen.getByRole('button', { name: '인증번호 받기' }));
    await user.type(await screen.findByRole('textbox', { name: '인증번호' }), '123456');
    await user.click(screen.getByRole('button', { name: '인증하기' }));
    await user.click(screen.getByRole('checkbox', { name: /서비스 이용약관/ }));
    await user.click(screen.getByRole('checkbox', { name: /개인정보 수집/ }));
    await user.click(screen.getByRole('checkbox', { name: /만 14세/ }));
    await user.click(screen.getByRole('button', { name: '가입 완료' }));

    expect(completeSignup).toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith('/onboarding/role');
    expect(refresh).toHaveBeenCalled();
  });
});
