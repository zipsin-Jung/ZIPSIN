import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('global Kakao inquiry entry', () => {
  it('TEST-SUPPORT-KAKAO-001 renders the inquiry entry once from the root layout', () => {
    const layout = readFileSync(join(process.cwd(), 'app/layout.tsx'), 'utf8');

    expect(layout).toMatch(/import\s+\{\s*KakaoInquiryButton\s*\}/);
    expect(layout).toMatch(/<KakaoInquiryButton\s*\/>/);
  });

  it('TEST-SUPPORT-KAKAO-004 explains the external record and sensitive-data boundary', () => {
    const supportPage = readFileSync(join(process.cwd(), 'app/(app)/support/page.tsx'), 'utf8');

    expect(supportPage).toContain('카카오 문의는 집신 기록에 자동 저장되지 않습니다.');
    expect(supportPage).toContain('주민등록번호, 계좌 비밀번호, 인증번호, 실제 계약서 원본은 보내지 마세요.');
    expect(supportPage).toContain('https://pf.kakao.com/_xhcxkFX');
  });
});
