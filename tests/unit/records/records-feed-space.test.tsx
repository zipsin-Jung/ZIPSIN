import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RecordsFeed } from '@/features/records/components/RecordsFeed';

// TEST-APP-REC-SPACE-001 (2026-10-18 Preview 검수): 사무소 구성원이 아니면 '사무소 내부' 고르기를 숨긴다.
describe('RecordsFeed space chips', () => {
  it('사무소 구성원이 아니면 사무소 내부 고르기가 없다', () => {
    render(<RecordsFeed records={[]} showOfficeSpace={false} />);
    const group = screen.getByRole('group', { name: '누가 보는 기록인지 고르기' });
    expect(within(group).getAllByRole('button').map((b) => b.textContent)).toEqual(['전체', '이번 계약 공유', '집 이력']);
  });
  it('구성원이면 세 칸 모두 보인다', () => {
    render(<RecordsFeed records={[]} />);
    const group = screen.getByRole('group', { name: '누가 보는 기록인지 고르기' });
    expect(within(group).getAllByRole('button')).toHaveLength(4);
  });
});
