import '@testing-library/jest-dom/vitest';
import {cleanup,render,screen} from '@testing-library/react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import LoginPage from './page';

beforeEach(()=>{vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://example.supabase.co');vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY','test-anon-key')});
afterEach(()=>{cleanup();vi.unstubAllEnvs()});

describe('집신 로그인 진입',()=>{
  it('간편 가입을 열고 집신 본 서비스만 준비 중으로 구분한다',async()=>{
    render(await LoginPage({searchParams:Promise.resolve({returnTo:'/ck'})}));
    expect(screen.getByText(/간편 가입하고 집신체크를 이어보세요/)).toBeInTheDocument();
    expect(screen.getByText(/지금 보던 집 기록은 이 기기에 그대로 남습니다/)).toBeInTheDocument();
    expect(screen.getByText(/집신 본 서비스와 내 집 자동 등록은 준비 중/)).toBeInTheDocument();
    expect(screen.getByRole('button',{name:'Google로 계속'})).toBeEnabled();
    expect(screen.getByRole('button',{name:'Kakao로 계속'})).toBeEnabled();
    expect(screen.queryByText(/계정 연동.*준비 중/)).not.toBeInTheDocument();
  });
});
