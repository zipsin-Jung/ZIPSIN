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
    const button = screen.getByRole('button', {name: '왜 확인하나요?'});

    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/습기 흔적은/)).not.toBeInTheDocument();
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/습기 흔적은/)).toBeInTheDocument();
  });

  it('상태와 출처를 선택해 부모에게 변경을 전달한다', () => {
    const onChange = vi.fn();
    render(<CheckFlow candidate={createCandidate({id: 'a', alias: 'A집', depth: 'quick', now})} onChange={onChange} onFinish={vi.fn()} onBack={vi.fn()}/>);

    fireEvent.click(screen.getByRole('button', {name: '주의'}));
    fireEvent.click(screen.getByRole('radio', {name: '직접 확인했어요'}));

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({answers: expect.objectContaining({moisture: expect.objectContaining({status: 'caution', source: 'observed'})})}));
  });

  it('모드 전환 시 기존 답을 보존하고 추가 항목 수를 늘린다', () => {
    const answered = answerItem(createCandidate({id: 'a', alias: 'A집', depth: 'quick', now}), 'moisture', {status: 'confirmed', source: 'observed'}, now);
    const onChange = vi.fn();
    render(<CheckFlow candidate={answered} onChange={onChange} onFinish={vi.fn()} onBack={vi.fn()}/>);

    fireEvent.click(screen.getByRole('button', {name: /더 꼼꼼히 보기/}));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({depth: 'thorough', answers: answered.answers}));
  });

  it('미응답이어도 완료할 수 있고 위험한 메모는 저장하지 않는다', () => {
    const onChange = vi.fn();
    const onFinish = vi.fn();
    render(<CheckFlow candidate={createCandidate({id: 'a', alias: 'A집', depth: 'quick', now})} onChange={onChange} onFinish={onFinish} onBack={vi.fn()}/>);

    fireEvent.change(screen.getByLabelText('선택 메모'), {target: {value: '공동현관 비밀번호 1234'}});
    fireEvent.blur(screen.getByLabelText('선택 메모'));
    expect(screen.getByRole('alert')).toHaveTextContent(/저장하지 않았어요/);
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', {name: '지금까지 요약 보기'}));
    expect(onFinish).toHaveBeenCalled();
  });
});
