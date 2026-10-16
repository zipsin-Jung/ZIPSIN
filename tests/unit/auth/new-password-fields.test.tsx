import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { NewPasswordFields } from '@/features/auth/components/NewPasswordFields';

describe('NewPasswordFields (시안 ⑨-B)', () => {
  it('TEST-NEWPW-001: 조건을 다 채우고 확인이 같아야 버튼이 켜진다', async () => {
    const user = userEvent.setup();
    render(<form><NewPasswordFields /></form>);
    const button = screen.getByRole('button', { name: '비밀번호 바꾸기' });
    expect(button).toBeDisabled();
    await user.type(screen.getByLabelText('새 비밀번호', { selector: 'input' }), 'home-2026');
    expect(screen.getByText('✓ 특수문자')).toBeInTheDocument();
    await user.type(screen.getByLabelText('새 비밀번호 확인'), 'home-2027');
    expect(screen.getByRole('alert')).toHaveTextContent('비밀번호가 서로 다릅니다.');
    expect(button).toBeDisabled();
    await user.clear(screen.getByLabelText('새 비밀번호 확인'));
    await user.type(screen.getByLabelText('새 비밀번호 확인'), 'home-2026');
    expect(button).toBeEnabled();
  });

  it('TEST-NEWPW-002: 보기 버튼으로 두 칸을 함께 보여 준다', async () => {
    const user = userEvent.setup();
    render(<form><NewPasswordFields /></form>);
    await user.click(screen.getByRole('button', { name: '비밀번호 보기' }));
    expect(screen.getByLabelText('새 비밀번호', { selector: 'input' })).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('새 비밀번호 확인')).toHaveAttribute('type', 'text');
  });
});
