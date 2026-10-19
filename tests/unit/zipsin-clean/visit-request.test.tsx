import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CleanApp } from '@/features/zipsin-clean/components/CleanApp';

const today = new Date(2026, 9, 18);

describe('CleanApp — 방문 견적·특수 청소 (체험)', () => {
  it('TEST-CL-VISIT-001 requests a special-cleaning visit after choosing what kind it is', async () => {
    const user = userEvent.setup();
    render(<CleanApp today={today} />);
    await user.click(screen.getByRole('button', { name: /특수 청소/ }));
    expect(screen.getByRole('heading', { level: 1, name: '방문 견적 요청' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /특수 청소/ })).toBeChecked();
    expect(screen.getByText(/곰팡이·물때처럼 더러운 정도는 특수 청소가 아니에요/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '방문 견적 요청하기 (체험)' }));
    expect(screen.getByRole('alert')).toHaveTextContent('어떤 특수 청소인지 골라 주세요.');
    await user.click(screen.getByRole('checkbox', { name: '화재·그을음' }));
    await user.click(screen.getByRole('checkbox', { name: '기타' }));
    await user.click(screen.getByRole('button', { name: '방문 견적 요청하기 (체험)' }));
    expect(screen.getByRole('alert')).toHaveTextContent('기타 상황을 적어 주세요.');
    await user.type(screen.getByLabelText('어떤 상황인지 적어 주세요'), '베란다 새시 그을음');
    await user.click(screen.getByRole('checkbox', { name: '기타' }));
    await user.click(screen.getByRole('button', { name: '방문 견적 요청하기 (체험)' }));
    expect(screen.getByRole('alert')).toHaveTextContent('주소를 구·동까지 적어 주세요.');
    await user.type(screen.getByLabelText('주소 (구·동까지)'), '마포구 공덕동');
    await user.click(screen.getByRole('button', { name: '방문 견적 요청하기 (체험)' }));
    expect(screen.getByRole('alert')).toHaveTextContent('방문 날짜와 시간대를 골라 주세요.');
    await user.click(screen.getByRole('button', { name: /10월 20일/ }));
    await user.click(screen.getByRole('button', { name: '오전' }));
    await user.type(screen.getByLabelText('연락처'), '12');
    await user.click(screen.getByRole('button', { name: '방문 견적 요청하기 (체험)' }));
    expect(screen.getByRole('alert')).toHaveTextContent('연락처를 010-0000-0000처럼 적어 주세요.');
    await user.clear(screen.getByLabelText('연락처'));
    await user.type(screen.getByLabelText('연락처'), '010-0000-0000');
    await user.click(screen.getByRole('button', { name: '방문 견적 요청하기 (체험)' }));

    expect(screen.getByRole('heading', { name: '방문 견적을 요청했어요' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('특수 청소 · 화재·그을음 · 마포구 공덕동 · 10월 20일 오전');
    expect(screen.getByText('예약한 가격은 작업 날 바뀌지 않아요.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '처음으로' }));
    expect(screen.getByRole('button', { name: '가격 보기' })).toBeInTheDocument();
  });

  it('TEST-CL-VISIT-002 opens a regular visit quote without special options', async () => {
    const user = userEvent.setup();
    render(<CleanApp today={today} />);
    await user.click(screen.getByRole('button', { name: /방문 견적 요청/ }));
    expect(screen.getByRole('radio', { name: /입주·이사 청소/ })).toBeChecked();
    expect(screen.queryByRole('checkbox', { name: '화재·그을음' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /특수 청소/ }));
    expect(screen.getByRole('checkbox', { name: '화재·그을음' })).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /생활 정리 청소/ }));
    await user.type(screen.getByLabelText('주소 (구·동까지)'), '마포구');
    await user.click(screen.getByRole('button', { name: /10월 19일/ }));
    await user.click(screen.getByRole('button', { name: '오후' }));
    await user.type(screen.getByLabelText('연락처'), '01000000000');
    await user.click(screen.getByRole('button', { name: '방문 견적 요청하기 (체험)' }));
    expect(screen.getByRole('status')).toHaveTextContent('생활 정리 청소 · 마포구 · 10월 19일 오후');
  });
});
