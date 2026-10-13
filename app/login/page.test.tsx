import '@testing-library/jest-dom/vitest';
import {cleanup,render,screen} from '@testing-library/react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import LoginPage from './page';

beforeEach(()=>{vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://example.supabase.co');vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY','test-anon-key')});
afterEach(()=>{cleanup();vi.unstubAllEnvs()});

describe('집신 로그인 진입',()=>{
  it('계정 연동과 내 집 등록이 준비 중임을 명확히 알린다',async()=>{
    render(await LoginPage({searchParams:Promise.resolve({returnTo:'/ck'})}));
    expect(screen.getByText(/집신 계정 연동과 내 집 등록은 준비 중입니다/)).toBeInTheDocument();
    expect(screen.queryByText(/안전하게 남아 있어요/)).not.toBeInTheDocument();
  });
});
