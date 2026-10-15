import '@testing-library/jest-dom/vitest';
import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import SalesDemo, {Handover} from './SalesDemo';
import {initialDemoState} from '@/lib/demo-state';

afterEach(cleanup);

describe('Handover permissions', () => {
  it('does not show the reassign action to an assistant', () => {
    render(<Handover state={{...initialDemoState, role:'assistant', view:'handover'}} setState={vi.fn()} onNext={vi.fn()}/>);

    expect(screen.queryByRole('button',{name:'최보조에게 담당 넘기기'})).not.toBeInTheDocument();
    expect(screen.getByText(/담당자 변경은 대표만/)).toBeInTheDocument();
  });

  it('shows the reassign action to a manager', () => {
    render(<Handover state={{...initialDemoState, role:'manager', view:'handover'}} setState={vi.fn()} onNext={vi.fn()}/>);

    expect(screen.getByRole('button',{name:'최보조에게 담당 넘기기'})).toBeInTheDocument();
  });
});

describe('SalesDemo journey', () => {
  it('completes the representative demo journey and focuses each changed view', () => {
    render(<SalesDemo/>);

    fireEvent.click(screen.getByRole('button',{name:/데모 시작하기/}));
    expect(screen.getByRole('heading',{name:/사무소 전체에서/})).toBeInTheDocument();
    expect(document.activeElement).toHaveAttribute('id','demo-main');

    fireEvent.click(screen.getByRole('button',{name:/광고 전 확인 필요/}));
    fireEvent.click(screen.getByRole('button',{name:/누수 사건 열기/}));
    fireEvent.click(screen.getByRole('button',{name:'완료'}));
    expect(screen.getByText('누수 보수 완료 사진')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'최보조에게 넘기기'}));
    fireEvent.click(screen.getByRole('button',{name:/인수인계 확인/}));
    expect(screen.getByRole('heading',{name:/최보조가 바로/})).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:/기록 요약 보기/}));
    expect(screen.getByRole('heading',{name:/업무가 한 장으로/})).toBeInTheDocument();
  });

  it('returns to the safety introduction when reset is selected', () => {
    render(<SalesDemo/>);
    fireEvent.click(screen.getByRole('button',{name:/데모 시작하기/}));
    fireEvent.click(screen.getByRole('button',{name:/처음부터/}));

    expect(screen.getByRole('heading',{name:/담당자가 바뀌어도/})).toBeInTheDocument();
    expect(screen.queryByRole('button',{name:/처음부터/})).not.toBeInTheDocument();
  });

  it('switches to the assistant view without exposing manager assignment controls', () => {
    render(<SalesDemo/>);
    fireEvent.click(screen.getByRole('button',{name:/데모 시작하기/}));
    fireEvent.click(screen.getByRole('button',{name:'보조원'}));
    fireEvent.click(screen.getByRole('button',{name:/사건 처리/}));

    expect(screen.getByText(/보조원은 담당자를 변경할 수 없습니다/)).toBeInTheDocument();
    expect(screen.queryByRole('button',{name:/에게 넘기기|되돌리기/})).not.toBeInTheDocument();
  });
});
