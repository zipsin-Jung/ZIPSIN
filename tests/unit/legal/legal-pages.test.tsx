import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PrivacyPage from '@/app/privacy/page';
import TermsPage from '@/app/terms/page';
import { closedAccountResponse } from '@/proxy';
import { NextRequest } from 'next/server';

describe('약관 · 개인정보처리방침 (2026-10-19)', () => {
  it('TEST-LEGAL-001 개인정보처리방침: 작성지침 필수 항목이 모두 있다', () => {
    render(<PrivacyPage />);
    for (const heading of [/처리하는 개인정보의 항목, 목적, 보유 기간/, /제3자 제공/, /처리 위탁/, /국외 이전/, /파기/, /권리와 행사 방법/, /안전성 확보/, /쿠키/, /보호책임자/, /권익침해 구제/, /변경/]) {
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
    }
    expect(screen.getByText(/다음 계약자에게 자동으로 넘어가지 않습니다/)).toBeInTheDocument();
  });

  it('TEST-LEGAL-002 이용약관: 돈을 맡지 않고 거래를 대신하지 않는다, 답 없음은 동의 아님', () => {
    render(<TermsPage />);
    expect(screen.getByText(/보증금 등 돈을 맡지 않습니다/)).toBeInTheDocument();
    expect(screen.getByText(/답하지 않은 항목은 동의한 것으로 보지 않습니다/)).toBeInTheDocument();
    for (const link of screen.getAllByRole('link', { name: '개인정보처리방침' })) expect(link).toHaveAttribute('href', '/privacy');
  });

  it('TEST-LEGAL-003 출시 전 채울 사업자 정보가 비어 있으면 화면에 "확인 중"으로 드러난다(지어내지 않음)', () => {
    render(<TermsPage />);
    expect(screen.getByRole('note')).toHaveTextContent('출시 전 확인 중인 항목');
  });

  it('TEST-LEGAL-004 새 로그인 후 화면도 회원가입이 닫혀 있으면 처음 화면으로 보낸다', () => {
    for (const path of ['/checklist', '/contract', '/living', '/expiry', '/more', '/notifications', '/partners/new', '/space', '/contacts']) {
      const response = closedAccountResponse(new NextRequest(`https://zipsin.net${path}`));
      expect(response.headers.get('location')).toBe('https://zipsin.net/');
    }
    expect(closedAccountResponse(new NextRequest('https://zipsin.net/terms')).headers.get('location')).toBeNull();
  });
});
