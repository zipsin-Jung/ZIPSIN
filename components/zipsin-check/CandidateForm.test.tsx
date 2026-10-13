import '@testing-library/jest-dom/vitest';
import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import CandidateForm from './CandidateForm';

afterEach(cleanup);

describe('집 등록', () => {
  it('간단하게를 기본으로 보이고 빈 입력도 제출한다', () => {
    const onSubmit = vi.fn();
    render(<CandidateForm onSubmit={onSubmit}/>);
    expect(screen.getByRole('radio', {name: '간단하게'})).toBeChecked();
    fireEvent.click(screen.getByRole('button', {name: '체크 시작'}));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({intakeMode: 'simple', alias: ''}));
  });

  it('유입 경로와 상세 선택 정보를 받는다', () => {
    const onSubmit = vi.fn();
    render(<CandidateForm onSubmit={onSubmit}/>);
    expect(screen.getAllByRole('option').map((item) => item.textContent)).toEqual(expect.arrayContaining(['당근', '네이버부동산', '직방', '다방', '부동산', '지인', '기타']));
    fireEvent.click(screen.getByRole('radio', {name: '상세하게'}));
    expect(screen.getByLabelText('위치')).toBeInTheDocument();
    expect(screen.getByLabelText('담당자 연락처')).toBeInTheDocument();
    expect(screen.getByText(/ 이 브라우저에만 저장/)).toBeInTheDocument();
  });

  it('음수와 과도한 금액을 막는다', () => {
    const onSubmit = vi.fn();
    render(<CandidateForm onSubmit={onSubmit}/>);
    fireEvent.click(screen.getByRole('radio', {name: '상세하게'}));
    fireEvent.change(screen.getByLabelText('보증금'), {target: {value: '-1'}});
    fireEvent.click(screen.getByRole('button', {name: '체크 시작'}));
    expect(screen.getByRole('alert')).toHaveTextContent('금액');
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
