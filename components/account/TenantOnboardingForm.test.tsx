import '@testing-library/jest-dom/vitest';
import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import TenantOnboardingForm from './TenantOnboardingForm';

afterEach(cleanup);

describe('임차인 유입 확인', () => {
  it('제안 유형을 바꾸고 필수 이전 동의만 제출한다', () => {
    const onSubmit = vi.fn();
    render(<TenantOnboardingForm onSubmit={onSubmit}/>);
    expect(screen.getByRole('radio', {name: '집 구하는 중'})).toBeChecked();
    fireEvent.click(screen.getByRole('radio', {name: '현재 임차인'}));
    fireEvent.click(screen.getByRole('checkbox', {name: /선택한 후보 기록을/}));
    fireEvent.click(screen.getByRole('button', {name: '확인하고 계속'}));
    expect(onSubmit).toHaveBeenCalledWith({userType: 'tenant', transferConsent: true, marketingConsent: false});
  });

  it('기록 이전 동의와 마케팅 동의를 분리한다', () => {
    render(<TenantOnboardingForm onSubmit={vi.fn()}/>);
    expect(screen.getByRole('checkbox', {name: /선택한 후보 기록을/})).toBeRequired();
    expect(screen.getByRole('checkbox', {name: /소식 받기/})).not.toBeRequired();
  });

  it('필수 동의 없이 제출하지 않는다', () => {
    const onSubmit = vi.fn();
    render(<TenantOnboardingForm onSubmit={onSubmit}/>);
    fireEvent.click(screen.getByRole('button', {name: '확인하고 계속'}));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('기록 이전 동의');
  });

  it('기록 이전 없이 가입한 사용자는 이전 동의 없이 집신체크로 돌아간다',()=>{
    const onSubmit=vi.fn();
    render(<TenantOnboardingForm requiresTransferConsent={false} onSubmit={onSubmit}/>);
    expect(screen.queryByRole('checkbox',{name:/선택한 후보 기록을/})).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'가입 완료하고 집신체크로'}));
    expect(onSubmit).toHaveBeenCalledWith({userType:'house_hunter',transferConsent:false,marketingConsent:false});
  });
});
