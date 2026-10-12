import '@testing-library/jest-dom/vitest';
import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {answerItem, createCandidate} from '@/lib/zipsin-check/state';
import CheckFlow from './CheckFlow';

afterEach(cleanup);
const now = '2026-10-13T00:00:00.000Z';

describe('체크 진행', () => {
  it('설명은 기본으로 접히고 접근 가능한 버튼으로 펼친다', () => {
    render(<CheckFlow candidate={createCandidate({id: 'a', alias: 'A집', depth: 'quick', now})} onChange={vi.fn()} onFinish={vi.fn()} onBack={vi.fn()}/>);
    const button = screen.getAllByRole('button', {name: '왜 확인하나요?'})[0];

    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/습기 흔적은/)).not.toBeInTheDocument();
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/습기 흔적은/)).toBeInTheDocument();
  });

  it('상태와 출처를 선택해 부모에게 변경을 전달한다', () => {
    const onChange = vi.fn();
    render(<CheckFlow candidate={createCandidate({id: 'a', alias: 'A집', depth: 'quick', now})} onChange={onChange} onFinish={vi.fn()} onBack={vi.fn()}/>);

    fireEvent.click(screen.getByRole('button', {name: '습기·곰팡이 주의'}));
    fireEvent.click(screen.getAllByRole('button', {name: '왜 확인하나요?'})[0]);
    fireEvent.click(screen.getAllByRole('radio', {name: '직접 확인했어요'})[0]);

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({answers: expect.objectContaining({moisture: expect.objectContaining({status: 'caution', source: 'observed'})})}));
  });

  it('모드 전환 시 기존 답을 보존하고 추가 항목 수를 늘린다', () => {
    const answered = answerItem(createCandidate({id: 'a', alias: 'A집', depth: 'quick', now}), 'moisture', {status: 'confirmed', source: 'observed'}, now);
    const onChange = vi.fn();
    render(<CheckFlow candidate={answered} onChange={onChange} onFinish={vi.fn()} onBack={vi.fn()}/>);

    fireEvent.click(screen.getByRole('button', {name: /더 꼼꼼히 보기/}));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({depth: 'thorough', answers: answered.answers}));
  });

  it('빠른 체크 9개와 꼼꼼 체크 16개를 넘김 없이 한 화면에 보여준다', () => {
    const {rerender} = render(<CheckFlow candidate={createCandidate({id: 'a', alias: 'A집', depth: 'quick', now})} onChange={vi.fn()} onFinish={vi.fn()} onBack={vi.fn()}/>);
    expect(screen.getAllByRole('heading', {level: 2})).toHaveLength(9);
    expect(screen.queryByRole('button', {name: '다음 항목'})).not.toBeInTheDocument();

    rerender(<CheckFlow candidate={createCandidate({id: 'a', alias: 'A집', depth: 'thorough', now})} onChange={vi.fn()} onFinish={vi.fn()} onBack={vi.fn()}/>);
    expect(screen.getAllByRole('heading', {level: 2})).toHaveLength(16);
  });

  it('반복 상태 버튼 이름에 항목명을 포함한다', () => {
    render(<CheckFlow candidate={createCandidate({id: 'a', alias: 'A집', depth: 'quick', now})} onChange={vi.fn()} onFinish={vi.fn()} onBack={vi.fn()}/>);
    expect(screen.getByRole('button', {name: '습기·곰팡이 주의'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: '소음 확인 못함'})).toBeInTheDocument();
  });

  it('미응답이어도 완료할 수 있고 위험한 메모는 저장하지 않는다', () => {
    const onChange = vi.fn();
    const onFinish = vi.fn();
    render(<CheckFlow candidate={createCandidate({id: 'a', alias: 'A집', depth: 'quick', now})} onChange={onChange} onFinish={onFinish} onBack={vi.fn()}/>);

    fireEvent.click(screen.getAllByRole('button', {name: '왜 확인하나요?'})[0]);
    const memo = screen.getAllByLabelText('선택 메모')[0];
    fireEvent.change(memo, {target: {value: '공동현관 비밀번호 1234'}});
    fireEvent.click(screen.getByRole('button', {name: '습기·곰팡이 주의'}));
    expect(screen.getByRole('alert')).toHaveTextContent(/저장하지 않았어요/);
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', {name: '체크 결과 정리하기'}));
    expect(onFinish).toHaveBeenCalled();
  });
});
