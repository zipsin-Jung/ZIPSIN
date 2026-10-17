import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { isAccountOpen } from '@/lib/site/account-launch';
import DecideSummary from '@/components/zipsin-check/DecideSummary';
import { createCandidateV2 } from '@/lib/zipsin-check/state';

describe('회원가입·집신 연결 준비 중 스위치', () => {
  beforeEach(() => { process.env.NEXT_PUBLIC_ACCOUNT_OPEN = 'false'; });
  afterEach(() => { process.env.NEXT_PUBLIC_ACCOUNT_OPEN = 'true'; });

  it('TEST-LAUNCH-001 값이 없거나 true가 아니면 닫힌 상태가 기본이다', () => {
    expect(isAccountOpen({})).toBe(false);
    expect(isAccountOpen({ NEXT_PUBLIC_ACCOUNT_OPEN: 'false' })).toBe(false);
    expect(isAccountOpen({ NEXT_PUBLIC_ACCOUNT_OPEN: 'true' })).toBe(true);
  });

  it('TEST-LAUNCH-002 닫혀 있으면 집신 시작은 누를 수 없는 준비 중 버튼이다', () => {
    const candidate = createCandidateV2({ id: 'a', alias: 'A집', index: 1, now: '2026-10-17T00:00:00.000Z', intakeMode: 'simple' });
    render(<DecideSummary candidate={candidate} onBack={() => {}} onStart={() => true} />);
    expect(screen.queryByRole('link', { name: '집신 시작' })).toBeNull();
    expect(screen.getByRole('button', { name: '집신 시작 · 준비 중' })).toBeDisabled();
  });
});
