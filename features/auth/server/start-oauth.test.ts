import {beforeEach,describe,expect,it,vi} from 'vitest';

const {signInWithOAuth}=vi.hoisted(()=>({signInWithOAuth:vi.fn()}));

vi.mock('@/lib/env/server',()=>({readServerEnv:()=>({oauthProviders:{google:true,kakao:true,naver:false}})}));
vi.mock('@/lib/supabase/server',()=>({createSupabaseServerClient:async()=>({auth:{signInWithOAuth}})}));

import {startOAuth} from './start-oauth';

describe('OAuth 가입 시작',()=>{
  beforeEach(()=>{vi.clearAllMocks();process.env.NEXT_PUBLIC_SITE_URL='https://preview.zipsin.net'});

  it.each(['google','kakao'] as const)('%s 가입을 Supabase callback과 안전한 /ck 복귀로 시작한다',async provider=>{
    signInWithOAuth.mockResolvedValue({data:{url:`https://auth.example/${provider}`},error:null});
    await expect(startOAuth(provider,'/ck')).resolves.toEqual({redirectTo:`https://auth.example/${provider}`});
    expect(signInWithOAuth).toHaveBeenCalledWith({provider,options:{redirectTo:'https://preview.zipsin.net/auth/callback?returnTo=%2Fck'}});
  });
});
