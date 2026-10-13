import {describe, expect, it} from 'vitest';
import {listProviderStates} from './providers';
import {getSafeReturnPath} from './return-path';

describe('safe auth return paths', () => {
  it.each([
    ['/ck/transfer', '/ck/transfer'],
    ['/my/candidates', '/my/candidates'],
    ['/my/candidates/abc?from=check', '/my/candidates/abc?from=check'],
    ['/onboarding/tenant?returnTo=%2Fck%2Ftransfer', '/onboarding/tenant?returnTo=%2Fck%2Ftransfer'],
  ])('keeps an allowed internal path', (input, expected) => {
    expect(getSafeReturnPath(input)).toBe(expected);
  });

  it.each([
    'https://evil.example/ck',
    '//evil.example/ck',
    '/%2F%2Fevil.example',
    '/admin',
    '/ck/../admin',
    'javascript:alert(1)',
  ])('replaces an unsafe return path: %s', (input) => {
    expect(getSafeReturnPath(input)).toBe('/ck');
  });
});

describe('OAuth provider availability', () => {
  it('marks providers as unavailable unless explicitly enabled', () => {
    expect(listProviderStates({google: false, kakao: false, naver: false})).toEqual([
      {provider: 'google', available: false, reason: 'not-configured'},
      {provider: 'kakao', available: false, reason: 'not-configured'},
      {provider: 'naver', available: false, reason: 'not-configured'},
    ]);
  });

  it('enables only providers explicitly configured', () => {
    expect(listProviderStates({google: true, kakao: true, naver: false})).toEqual([
      {provider: 'google', available: true},
      {provider: 'kakao', available: true},
      {provider: 'naver', available: false, reason: 'not-configured'},
    ]);
  });
});
