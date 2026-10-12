import '@testing-library/jest-dom/vitest';
import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {createCandidate} from '@/lib/zipsin-check/state';
import {CHECK_STORAGE_KEY} from '@/lib/zipsin-check/storage';
import ZipsinCheckApp from './ZipsinCheckApp';

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe('집신체크 시작', () => {
  it('빠른·꼼꼼 선택과 예상 시간, 별칭 건너뛰기를 제공한다', () => {
    render(<ZipsinCheckApp/>);

    expect(screen.getByRole('heading', {name: '시간에 맞게 확인해 보세요.'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /빠르게 체크/})).toHaveTextContent('3~5분');
    expect(screen.getByRole('button', {name: /꼼꼼하게 체크/})).toHaveTextContent('10~15분');
    expect(screen.getByLabelText('후보 별칭')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', {name: /별칭 없이 빠르게 체크 시작/}));
    expect(screen.getByRole('heading', {name: /후보 1 체크/})).toBeInTheDocument();
  });

  it('기기에 저장된 후보가 있으면 이어보기를 제안한다', async () => {
    const candidate = createCandidate({id: 'a', alias: '햇살 좋은 집', depth: 'quick', now: '2026-10-13T00:00:00.000Z'});
    localStorage.setItem(CHECK_STORAGE_KEY, JSON.stringify({schemaVersion: 1, candidates: [candidate], activeCandidateId: 'a'}));

    render(<ZipsinCheckApp/>);

    expect(await screen.findByRole('button', {name: /햇살 좋은 집 이어서 보기/})).toBeInTheDocument();
    expect(screen.getByText(/공용 기기에서는 다른 사람이 볼 수 있어요/)).toBeInTheDocument();
  });
});
