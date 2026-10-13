import '@testing-library/jest-dom/vitest';
import {cleanup, render, screen, within} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {answerItem, createCandidate} from '@/lib/zipsin-check/state';
import CheckSummary from './CheckSummary';

afterEach(cleanup);

describe('방문 요약', () => {
  it('주의를 독립 노출하고 미확인마다 다음 행동과 면책을 표시한다', () => {
    const now = '2026-10-13T00:00:00.000Z';
    const candidate = answerItem(createCandidate({id: 'a', alias: 'A집', depth: 'quick', now}), 'moisture-leak', {status: 'caution', source: 'observed'}, now);
    render(<CheckSummary candidate={candidate} canCompare={false} onBack={vi.fn()} onAdd={vi.fn()} onCompare={vi.fn()}/>);

    const caution = screen.getByRole('region', {name: /주의 1개/});
    expect(within(caution).getByText('곰팡이·누수')).toBeInTheDocument();
    const unverified = screen.getByRole('region', {name: /확인 못함 4개/});
    expect(within(unverified).getAllByText(/다음:/).length).toBe(4);
    expect(screen.getByText(/법률·안전·하자 판정이 아니에요/)).toBeInTheDocument();
  });
});
