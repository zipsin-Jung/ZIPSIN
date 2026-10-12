import '@testing-library/jest-dom/vitest';
import {cleanup, render, screen} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {answerItem, createCandidate} from '@/lib/zipsin-check/state';
import CheckCompare from './CheckCompare';

afterEach(cleanup);

describe('후보 비교', () => {
  it('서로 다른 깊이도 공통 핵심만 비교하고 미확인과 주의를 문구로 구분한다', () => {
    const now = '2026-10-13T00:00:00.000Z';
    const quick = answerItem(createCandidate({id: 'a', alias: 'A집', depth: 'quick', now}), 'moisture', {status: 'caution', source: 'observed'}, now);
    const thorough = answerItem(createCandidate({id: 'b', alias: 'B집', depth: 'thorough', now}), 'outlets', {status: 'confirmed', source: 'observed'}, now);
    render(<CheckCompare candidates={[quick, thorough]} onBack={vi.fn()}/>);

    expect(screen.getByRole('columnheader', {name: 'A집'})).toBeInTheDocument();
    expect(screen.getByRole('columnheader', {name: 'B집'})).toBeInTheDocument();
    expect(screen.getAllByText('주의').length).toBeGreaterThan(0);
    expect(screen.getAllByText('미확인').length).toBeGreaterThan(0);
    expect(screen.queryByText('콘센트·통신')).not.toBeInTheDocument();
    expect(screen.getByText(/추가 항목 수가 달라도 불리하게 계산하지 않아요/)).toBeInTheDocument();
    expect(screen.getByRole('article', {name: /A집 비교 카드/})).toBeInTheDocument();
    expect(screen.getByRole('article', {name: /B집 비교 카드/})).toBeInTheDocument();
    expect(screen.getAllByText(/전문가 확인 0/)).toHaveLength(2);
    expect(screen.getByRole('heading', {name: '후보 집 비교'})).toHaveFocus();
  });
});
