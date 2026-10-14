import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient: vi.fn() }));
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PhoneVerificationRequiredError, requirePhoneVerifiedUser } from './session';

describe('requirePhoneVerifiedUser', () => {
  it('rejects an authenticated account without a verified phone', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
      from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: { phone_verified_at: null }, error: null }) })) })) })),
    } as never);
    await expect(requirePhoneVerifiedUser()).rejects.toBeInstanceOf(PhoneVerificationRequiredError);
  });
});
