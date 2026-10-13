import {beforeEach,describe,expect,it,vi} from 'vitest';

const {exchangeCodeForSession}=vi.hoisted(()=>({exchangeCodeForSession:vi.fn()}));
vi.mock('@/lib/supabase/server',()=>({createSupabaseServerClient:async()=>({auth:{exchangeCodeForSession}})}));

import {GET} from './route';

describe('OAuth callback',()=>{
  beforeEach(()=>{vi.clearAllMocks()});

  it('code를 세션으로 교환하고 일반 가입을 /ck 복귀 온보딩으로 이어준다',async()=>{
    exchangeCodeForSession.mockResolvedValue({error:null});
    const response=await GET(new Request('https://preview.zipsin.net/auth/callback?code=ready&returnTo=%2Fck'));
    expect(exchangeCodeForSession).toHaveBeenCalledWith('ready');
    expect(response.headers.get('location')).toBe('https://preview.zipsin.net/onboarding/tenant?returnTo=%2Fck');
  });

  it('특정 후보 이전 복귀를 그대로 보존한다',async()=>{
    exchangeCodeForSession.mockResolvedValue({error:null});
    const response=await GET(new Request('https://preview.zipsin.net/auth/callback?code=ready&returnTo=%2Fck%2Ftransfer%3Fcandidate%3Dcandidate-1'));
    expect(response.headers.get('location')).toBe('https://preview.zipsin.net/onboarding/tenant?returnTo=%2Fck%2Ftransfer%3Fcandidate%3Dcandidate-1');
  });
});
