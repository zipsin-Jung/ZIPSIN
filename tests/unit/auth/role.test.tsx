import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RolePicker } from '@/features/auth/components/RolePicker';
import { parsePrimaryRole, ROLE_OPTIONS } from '@/features/auth/domain/roles';

describe('roles', () => {
  it('정해진 네 역할 외의 값을 거부한다', () => {
    expect(parsePrimaryRole('landlord')).toBe('landlord');
    expect(() => parsePrimaryRole('repairer')).toThrow('역할');
  });

  it('각 역할이 할 수 있는 일과 권한 확인 안내를 보여준다', () => {
    expect(ROLE_OPTIONS).toHaveLength(4);
    expect(ROLE_OPTIONS.every((role) => role.requiresInvitationNotice.length > 0)).toBe(true);
  });

  it('선택한 역할만 저장 요청하고 리소스 권한을 요청하지 않는다', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<RolePicker onSave={onSave} />);

    await user.click(screen.getByRole('radio', { name: '임대인' }));
    await user.click(screen.getByRole('button', { name: '이 역할로 시작하기' }));

    expect(onSave).toHaveBeenCalledWith('landlord');
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
