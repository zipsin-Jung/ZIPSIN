import { describe, expect, it } from 'vitest';
import { isIosLike, resolveInstallMode } from '@/features/install/install-state';

describe('집신 웹앱 설치 상태', () => {
  it('TEST-PWA-IOS-001 iPhone과 터치 기반 iPadOS를 iOS 계열로 판별한다', () => {
    expect(isIosLike({ userAgent: 'Mozilla/5.0 (iPhone)', platform: 'iPhone', maxTouchPoints: 5 })).toBe(true);
    expect(isIosLike({ userAgent: 'Mozilla/5.0 Safari', platform: 'MacIntel', maxTouchPoints: 5 })).toBe(true);
    expect(isIosLike({ userAgent: 'Mozilla/5.0 Safari', platform: 'MacIntel', maxTouchPoints: 0 })).toBe(false);
  });

  it('TEST-PWA-IOS-001 설치 프롬프트가 준비되면 iOS 안내보다 브라우저 프롬프트를 우선한다', () => {
    expect(resolveInstallMode({ promptAvailable: true, ios: true, standalone: false })).toBe('prompt-ready');
  });

  it('TEST-PWA-FALLBACK-001 프롬프트가 없는 iOS와 일반 브라우저에 맞는 안내를 고른다', () => {
    expect(resolveInstallMode({ promptAvailable: false, ios: true, standalone: false })).toBe('ios-guide');
    expect(resolveInstallMode({ promptAvailable: false, ios: false, standalone: false })).toBe('generic-guide');
  });

  it('TEST-PWA-STANDALONE-001 이미 독립 실행 중이면 다른 조건보다 설치됨을 우선한다', () => {
    expect(resolveInstallMode({ promptAvailable: true, ios: true, standalone: true })).toBe('installed');
  });
});
