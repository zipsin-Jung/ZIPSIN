import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NextActions } from '@/features/contracts/components/NextActions';

describe('NextActions', () => {
  it('TEST-ZH-UI-004 renders at most three real destinations with one reason each', () => {
    render(<NextActions actions={[
      { id: 'contract_dates', title: '계약 기간 확인하기', description: '날짜를 직접 확인하세요.', href: '/a' },
      { id: 'contract_document', title: '계약서 보관하기', description: '문서를 보관하세요.', href: '/b' },
      { id: 'move_in_photo', title: '입주 상태 남기기', description: '사진을 남기세요.', href: '/c' },
      { id: 'expiry_plan', title: '만기 계획 정하기', description: '계획을 정하세요.', href: '/d' },
    ]} />);
    expect(screen.getAllByRole('link')).toHaveLength(3);
    expect(screen.queryByText('만기 계획 정하기')).not.toBeInTheDocument();
  });

  it('shows a calm completed state when there is no next action', () => {
    render(<NextActions actions={[]} />);
    expect(screen.getByText('지금 바로 확인할 일이 없습니다')).toBeInTheDocument();
  });
});
