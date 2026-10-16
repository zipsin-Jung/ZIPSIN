import { describe, expect, it } from 'vitest';
import { buildInstallUrl, isPhoneLike, readInstallRequest } from '@/features/install/install-target';

describe('TEST-CK-INSTALL-001 휴대폰·PC 구분', () => {
  it('아이폰·안드로이드는 휴대폰 안내를 쓴다', () => {
    expect(isPhoneLike({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', coarsePointer: true })).toBe(true);
    expect(isPhoneLike({ userAgent: 'Mozilla/5.0 (Linux; Android 15; SM-S928N) SamsungBrowser/27.0', coarsePointer: true })).toBe(true);
  });

  it('마우스를 쓰는 PC는 QR 안내를 쓴다', () => {
    expect(isPhoneLike({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/141', coarsePointer: false })).toBe(false);
    expect(isPhoneLike({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/141', coarsePointer: false })).toBe(false);
  });

  it('터치 화면만으로는 휴대폰으로 보지 않는다(터치 노트북)', () => {
    expect(isPhoneLike({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/141', coarsePointer: true })).toBe(false);
  });
});

describe('TEST-CK-INSTALL-002 QR 주소', () => {
  it('지금 접속한 주소의 집신체크 설치 안내로 연결한다', () => {
    expect(buildInstallUrl('https://ck.zipsin.net', '/ck')).toBe('https://ck.zipsin.net/ck?install=1');
  });

  it('QR로 들어온 요청만 설치 안내를 자동으로 연다', () => {
    expect(readInstallRequest('?install=1')).toBe(true);
    expect(readInstallRequest('?install=0')).toBe(false);
    expect(readInstallRequest('?ref=qr')).toBe(false);
    expect(readInstallRequest('')).toBe(false);
  });
});
