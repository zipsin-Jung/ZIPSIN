import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';

const {saveOnboarding,redirect}=vi.hoisted(()=>({saveOnboarding:vi.fn(),redirect:vi.fn()}));
vi.mock('@/features/account/server/save-onboarding',()=>({saveOnboarding}));
vi.mock('next/navigation',()=>({redirect}));

import TenantOnboardingPage from './page';

describe('일반 가입과 후보 이전 온보딩',()=>{
  beforeEach(()=>vi.clearAllMocks());
  afterEach(()=>cleanup());

  it('일반 가입은 이전 동의 없이 저장하고 /ck로 복귀한다',async()=>{
    render(await TenantOnboardingPage({searchParams:Promise.resolve({returnTo:'/ck'})}));
    fireEvent.click(screen.getByRole('button',{name:'가입 완료하고 집신체크로'}));
    await waitFor(()=>expect(saveOnboarding).toHaveBeenCalledWith({userType:'house_hunter',transferConsent:false,marketingConsent:false},{requiresTransferConsent:false}));
    expect(redirect).toHaveBeenCalledWith('/ck');
  });

  it('특정 후보 이전은 미동의 상태에서 서버 저장과 이동을 막는다',async()=>{
    render(await TenantOnboardingPage({searchParams:Promise.resolve({returnTo:'/ck/transfer?candidate=candidate-1'})}));
    fireEvent.click(screen.getByRole('button',{name:'확인하고 계속'}));
    expect((await screen.findByRole('alert')).textContent).toBe('기록 이전 동의가 필요해요.');
    expect(saveOnboarding).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('특정 후보 이전에 동의하면 서버 저장 후 선택한 경로로 복귀한다',async()=>{
    const returnTo='/ck/transfer?candidate=candidate-1';
    render(await TenantOnboardingPage({searchParams:Promise.resolve({returnTo})}));
    fireEvent.click(screen.getByRole('checkbox',{name:/선택한 후보 기록을/}));
    fireEvent.click(screen.getByRole('button',{name:'확인하고 계속'}));
    await waitFor(()=>expect(saveOnboarding).toHaveBeenCalledWith({userType:'house_hunter',transferConsent:true,marketingConsent:false},{requiresTransferConsent:true}));
    expect(redirect).toHaveBeenCalledWith(returnTo);
  });
});
