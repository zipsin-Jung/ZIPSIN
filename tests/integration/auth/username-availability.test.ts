import { describe, expect, it, vi } from 'vitest';
import { checkUsernameAvailability } from '@/features/auth/services/check-username-availability';

describe('checkUsernameAvailability', () => {
  it('사용 가능한 정규화 아이디를 available로 반환한다', async () => {
    const findUsername = vi.fn().mockResolvedValue(false);
    await expect(checkUsernameAvailability({ findUsername }, ' New_User ')).resolves.toEqual({ status: 'available' });
    expect(findUsername).toHaveBeenCalledWith('new_user');
  });

  it('이미 등록된 아이디를 unavailable로 반환한다', async () => {
    const findUsername = vi.fn().mockResolvedValue(true);
    await expect(checkUsernameAvailability({ findUsername }, 'taken_name')).resolves.toEqual({ status: 'unavailable' });
  });

  it.each(['abc', '한글아이디', 'admin'])('잘못된 아이디 %s를 조회하지 않는다', async (username) => {
    const findUsername = vi.fn();
    await expect(checkUsernameAvailability({ findUsername }, username)).resolves.toEqual({ status: 'invalid' });
    expect(findUsername).not.toHaveBeenCalled();
  });

  it('저장소 오류에서 계정 존재 여부를 추측할 수 없는 오류를 반환한다', async () => {
    const findUsername = vi.fn().mockRejectedValue(new Error('database unavailable'));
    await expect(checkUsernameAvailability({ findUsername }, 'valid_name')).resolves.toEqual({ status: 'temporarily_unavailable' });
  });
});
