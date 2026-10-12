import '@testing-library/jest-dom/vitest';
import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {createCandidate} from '@/lib/zipsin-check/state';
import {CHECK_STORAGE_KEY} from '@/lib/zipsin-check/storage';
import ZipsinCheckApp from './ZipsinCheckApp';

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe('집신체크 시작', () => {
  it('필수 입력 없이 한 번 눌러 현장 체크를 시작한다', () => {
    render(<ZipsinCheckApp/>);

    expect(screen.getByRole('heading', {name: '집 보면서 바로 체크하세요.'})).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByText(/데모|체험판/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', {name: '바로 체크 시작'}));
    expect(screen.getByRole('heading', {name: /오늘 본 집 1 체크/})).toBeInTheDocument();
  });

  it('기기에 저장된 후보가 있으면 이어보기를 제안한다', async () => {
    const candidate = createCandidate({id: 'a', alias: '햇살 좋은 집', depth: 'quick', now: '2026-10-13T00:00:00.000Z'});
    localStorage.setItem(CHECK_STORAGE_KEY, JSON.stringify({schemaVersion: 1, candidates: [candidate], activeCandidateId: 'a'}));

    render(<ZipsinCheckApp/>);

    expect(await screen.findByRole('button', {name: /햇살 좋은 집 이어서 보기/})).toBeInTheDocument();
    expect(screen.getByText(/이 브라우저에만 저장되고 외부로 전송되지 않아요/)).toBeInTheDocument();
  });

  it('저장 실패를 알려도 현재 체크는 유지한다', async () => {
    const failingStorage = {
      getItem: () => null,
      setItem: () => { throw new Error('quota'); },
    } as unknown as Storage;
    render(<ZipsinCheckApp storage={failingStorage}/>);

    fireEvent.click(screen.getByRole('button', {name: '바로 체크 시작'}));

    expect(screen.getByRole('heading', {name: /오늘 본 집 1 체크/})).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent(/기기에 저장하지 못했어요/);
  });

  it('후보를 삭제하지 않고 비교에서 제외한 뒤 복원한다', async () => {
    const candidate = {...createCandidate({id: 'a', alias: '잠시 뺀 집', depth: 'quick', now: '2026-10-13T00:00:00.000Z'}), archived: true};
    localStorage.setItem(CHECK_STORAGE_KEY, JSON.stringify({schemaVersion: 1, candidates: [candidate]}));
    render(<ZipsinCheckApp/>);

    const restore = await screen.findByRole('button', {name: /잠시 뺀 집 다시 포함/});
    fireEvent.click(restore);

    expect(screen.getByRole('button', {name: /잠시 뺀 집 이어서 보기/})).toBeInTheDocument();
  });

  it('요약에서 실제 계정 저장이 아닌 가입 안내임을 밝힌다', () => {
    render(<ZipsinCheckApp/>);
    fireEvent.click(screen.getByRole('button', {name: '바로 체크 시작'}));
    fireEvent.click(screen.getByRole('button', {name: '방문 끝내기'}));

    const link = screen.getByRole('link', {name: /집신 가입 안내 보기/});
    expect(link).toHaveAttribute('href', '/#signup');
    expect(link).toHaveTextContent(/계정에는 아직 저장되지 않아요/);
    expect(screen.getByRole('heading', {name: /다시 볼 것을 정리했어요/})).toHaveFocus();
  });

  it('복구한 두 후보의 답을 바꾸고 비교한 뒤 한 후보를 제외한다', async () => {
    const now = '2026-10-13T00:00:00.000Z';
    const candidates = [
      createCandidate({id: 'a', alias: 'A집', depth: 'quick', now}),
      createCandidate({id: 'b', alias: 'B집', depth: 'thorough', now}),
    ];
    localStorage.setItem(CHECK_STORAGE_KEY, JSON.stringify({schemaVersion: 1, candidates, activeCandidateId: 'a'}));
    render(<ZipsinCheckApp/>);

    fireEvent.click(await screen.findByRole('button', {name: /A집 이어서 보기/}));
    fireEvent.click(screen.getByRole('button', {name: '습기·곰팡이 확인 필요'}));
    fireEvent.click(screen.getByRole('button', {name: '방문 끝내기'}));
    fireEvent.click(screen.getByRole('button', {name: '후보 집 비교하기'}));
    expect(screen.getByRole('heading', {name: '후보 집 비교'})).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', {name: /요약으로 돌아가기/}));
    fireEvent.click(screen.getByRole('button', {name: /체크로 돌아가기/}));
    fireEvent.click(screen.getByRole('button', {name: /목록/}));
    fireEvent.click(screen.getByRole('button', {name: 'A집 비교에서 제외'}));
    expect(screen.getByRole('button', {name: /A집 다시 포함/})).toBeInTheDocument();
  });

  it('손상된 기존 저장값을 첫 렌더에서 빈 기록으로 덮어쓰지 않는다', async () => {
    let raw = '{broken';
    let writes = 0;
    const storage = {getItem: () => raw, setItem: (_key: string, value: string) => { writes += 1; raw = value; }} as unknown as Storage;
    render(<ZipsinCheckApp storage={storage}/>);

    expect(await screen.findByRole('alert')).toHaveTextContent(/이전 기록을 불러오지 못했어요/);
    expect(writes).toBe(0);
    expect(raw).toBe('{broken');
  });
});
