import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { dayLabel, RecordsFeed, type FeedRecord } from '@/features/records/components/RecordsFeed';

const now = new Date('2026-10-18T03:00:00Z');
const rec = (id: string, space: FeedRecord['space'], occurredAt: string, files = 0): FeedRecord => ({ id, homeId: `home-${id}`, homeName: `${id}호`, space, kind: 'photo', title: `기록 ${id}`, occurredAt, files });

describe('RecordsFeed', () => {
  it('TEST-FEED-001 groups by day and filters by who can see the record', async () => {
    render(<RecordsFeed now={now} records={[rec('201', 'office_internal', '2026-10-18T01:00:00Z', 2), rec('102', 'current_contract', '2026-10-17T01:00:00Z')]} />);
    expect(screen.getByRole('heading', { name: '오늘' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '어제' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /기록 201 · 파일 2개/ })).toHaveAttribute('href', '/homes/home-201');
    await userEvent.click(within(screen.getByRole('group')).getByRole('button', { name: '이번 계약 공유' }));
    expect(screen.queryByText(/기록 201/)).not.toBeInTheDocument();
    expect(screen.getByText(/기록 102/)).toBeInTheDocument();
    await userEvent.click(within(screen.getByRole('group')).getByRole('button', { name: '집 이력' }));
    expect(screen.getByText('집 이력 기록이 없어요.')).toBeInTheDocument();
  });
  it('TEST-FEED-002 labels older days with a date', () => {
    expect(dayLabel('2026-10-13T01:00:00Z', now)).toBe('10월 13일');
  });
});
