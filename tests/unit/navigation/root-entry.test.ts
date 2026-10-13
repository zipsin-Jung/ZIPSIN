import { describe, expect, it } from 'vitest';
import { resolveRootDestination } from '@/features/navigation/root-entry';

describe('resolveRootDestination', () => {
  it('로그인하지 않은 사용자는 정식 메인페이지를 본다', () => {
    expect(resolveRootDestination(false)).toBeNull();
  });

  it('로그인한 사용자를 실제 업무 홈으로 보낸다', () => {
    expect(resolveRootDestination(true)).toBe('/home');
  });
});
