import {fireEvent, render, screen, within} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {createCandidateV2, updateCandidateDetails} from '@/lib/zipsin-check/state';
import DecideSummary, {buildDecision} from './DecideSummary';

const now = '2026-10-17T00:00:00.000Z';
const home = () => {
  const base = updateCandidateDetails(createCandidateV2({id: 'h1', alias: '성수 투룸', index: 1, now, intakeMode: 'detailed'}), {listing: {location: '성수동', discoverySource: '직방'}, terms: {depositWon: 10_000_000, monthlyRentWon: 600_000}}, now);
  return {...base, answers: {
    'water-drain': {status: 'confirmed' as const, source: 'observed' as const},
    daylight: {status: 'confirmed' as const, source: 'observed' as const, memo: '오후 햇빛 좋음'},
    'moisture-leak': {status: 'caution' as const, source: 'observed' as const},
  }};
};

describe('이 집으로 확정 요약', () => {
  it('TEST-CK-DECIDE-001 문제없음 항목만 좋았던 점으로, 문제 있음은 계약 전 확인으로 나눈다', () => {
    const result = buildDecision(home());
    expect(result.good).toEqual(['물·배수', '채광']);
    expect(result.recheck).toEqual(['곰팡이·누수']);
    expect(result.notes).toEqual([{title: '채광', memo: '오후 햇빛 좋음'}]);
    expect(result.terms[0]).toMatch(/^보증금·월세/);
  });

  it('TEST-CK-DECIDE-002 처음 본 곳·좋았던 점을 보여주고 집신 시작은 이 집만 옮기러 간다', () => {
    const onStart = vi.fn(() => true);
    render(<DecideSummary candidate={home()} onBack={() => {}} onStart={onStart}/>);
    expect(screen.getByRole('heading', {name: '성수 투룸'})).toHaveFocus();
    expect(within(screen.getByRole('region', {name: '처음 본 곳'})).getByText('직방')).toBeInTheDocument();
    expect(within(screen.getByRole('region', {name: '좋았던 점 2개'})).getByText('채광 문제없음')).toBeInTheDocument();
    const start = screen.getByRole('link', {name: '집신 시작'});
    expect(start).toHaveAttribute('href', '/ck/transfer?candidates=h1');
    fireEvent.click(start);
    expect(onStart).toHaveBeenCalled();
  });
});
