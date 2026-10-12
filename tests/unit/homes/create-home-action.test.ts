import { beforeEach, describe, expect, it, vi } from 'vitest';
const { guard, rpc, revalidate } = vi.hoisted(() => ({ guard: vi.fn(), rpc: vi.fn(), revalidate: vi.fn() }));
vi.mock('@/features/auth/guards/require-onboarding', () => ({ requireOnboardingComplete: guard }));
vi.mock('next/navigation', () => ({ redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); } }));
vi.mock('next/cache', () => ({ revalidatePath: revalidate }));
import { createHomeAction } from '@/features/homes/actions/create-home';
function form() {
  const data = new FormData();
  Object.entries({ officeId: '00000000-0000-4000-8000-000000000001', addressLine1: '서울시 예시로 10', addressDetail: '101호', homeLabel: '첫 집', idempotencyKey: '00000000-0000-4000-8000-000000000002' }).forEach(([key, value]) => data.set(key, value));
  return data;
}
describe('createHomeAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    guard.mockResolvedValue({ supabase: { rpc } });
    rpc.mockResolvedValue({ data: '00000000-0000-4000-8000-000000000003', error: null });
  });
  it('TEST-HOME-013 checks session, calls only the office-bound RPC, then opens the new timeline', async () => {
    await expect(createHomeAction(form())).rejects.toThrow('REDIRECT:/homes/00000000-0000-4000-8000-000000000003');
    expect(guard).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledExactlyOnceWith('create_home_for_office', { p_office_id: '00000000-0000-4000-8000-000000000001', p_address_line1: '서울시 예시로 10', p_address_detail: '101호', p_home_label: '첫 집', p_idempotency_key: '00000000-0000-4000-8000-000000000002' });
    expect(revalidate).toHaveBeenCalledWith('/home');
    expect(revalidate).toHaveBeenCalledWith('/homes');
  });
  it('TEST-HOME-014 returns field errors without mutation', async () => {
    const invalid = form(); invalid.set('addressLine1', '');
    expect(await createHomeAction(invalid)).toMatchObject({ fieldErrors: { addressLine1: '도로명 주소를 5~200자로 입력해 주세요.' } });
    expect(rpc).not.toHaveBeenCalled();
  });
  it('TEST-HOME-015 exposes only safe Korean guidance for another office', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'permission_denied', details: 'private' } });
    expect(await createHomeAction(form())).toEqual({ error: '이 작업을 수행할 권한이 없습니다.' });
    expect(revalidate).not.toHaveBeenCalled();
  });
});
