import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CleanApp } from '@/features/zipsin-clean/components/CleanApp';

const today = new Date(2026, 9, 18);

async function toDateStep() {
  const user = userEvent.setup();
  render(<CleanApp today={today} />);
  await user.click(screen.getByRole('button', { name: '가격 보기' }));
  await user.click(screen.getByRole('button', { name: '이 가격으로 예약하기' }));
  return user;
}

describe('CleanApp — 배포 전 눌러 보는 집신클린 (체험)', () => {
  it('TEST-CL-FLOW-001 goes from price to a finished house record without any extra charge', async () => {
    const user = await toDateStep();
    expect(screen.getByRole('heading', { name: '언제 할까요?' })).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent('실제로 예약되지 않아요');
    await user.click(screen.getByRole('button', { name: /10월 19일/ }));
    await user.selectOptions(screen.getByLabelText(/이삿짐이 들어오는 시간/), '17');
    expect(screen.getByRole('button', { name: /오전 10시 시작/ })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '오전 9시 시작' }));
    expect(screen.getByText('오전 9시에 시작하면 오후 4시쯤 끝나요.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '다음' }));

    expect(screen.getByText(/가격은 모두 같아요/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /초록손 청소/ }));
    await user.click(screen.getByRole('button', { name: '이 업체로 할게요' }));

    await user.type(screen.getByLabelText('주소 (구·동까지)'), '마포구 공덕동');
    await user.type(screen.getByLabelText('상세 주소'), '101동 1203호');
    await user.type(screen.getByLabelText('연락처'), '010-1234-5678');
    expect(screen.getByText(/고른 업체에게만/)).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: '아이가 살고 있어요' }));
    await user.click(screen.getByRole('checkbox', { name: '화학약품은 삼가 주세요' }));
    await user.type(screen.getByLabelText('메모'), '락스는 빼 주세요');
    expect(screen.getByText(/요청으로 가격이 바뀌지 않아요/)).toHaveTextContent('(9/200)');
    await user.click(screen.getByRole('button', { name: '다음' }));

    expect(screen.getByRole('heading', { name: '예약 내용을 확인해 주세요' })).toBeInTheDocument();
    expect(screen.getByText('아이가 살고 있어요 · 화학약품은 삼가 주세요 · 락스는 빼 주세요')).toBeInTheDocument();
    expect(screen.getByText('오전 9시 ~ 오후 4시')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '예약하기 (체험)' }));

    expect(screen.getByRole('heading', { name: '예약됐어요' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '작업 날 미리 보기' }));
    expect(screen.getByText(/가격은 그대로 325,000원/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '작업 시작 (업체가 누름)' }));
    await user.click(screen.getByRole('button', { name: '작업 끝 (업체가 누름)' }));
    expect(screen.getByRole('region', { name: '업체가 남긴 말' })).toHaveTextContent('순한 세제만 썼어요');
    await user.click(screen.getByRole('button', { name: '직접 확인하기' }));
    expect(screen.getByRole('button', { name: '검수 완료' })).toBeDisabled();
    for (const group of screen.getAllByRole('group')) await user.click(within(group).getByRole('radio', { name: '아니요' }));
    await user.click(screen.getByRole('button', { name: '검수 완료' }));

    const record = screen.getByRole('region', { name: '집 기록' });
    expect(record).toHaveTextContent('+ 추가요금 작업 시작 뒤0원');
    expect(record).toHaveTextContent('마포구 공덕동');
    expect(record).not.toHaveTextContent('1203호');
    expect(record).not.toHaveTextContent('010-1234-5678');
    expect(record).not.toHaveTextContent('아이가 살고 있어요');
    expect(record).not.toHaveTextContent('락스');
  });

  it('TEST-CL-FLOW-002 sends a redo request without charge when the customer finds a problem', async () => {
    const user = await toDateStep();
    await user.click(screen.getByRole('button', { name: /10월 19일/ }));
    await user.click(screen.getByRole('button', { name: '오전 8시 시작' }));
    await user.click(screen.getByRole('button', { name: '다음' }));
    await user.click(screen.getByRole('button', { name: /초록손 청소/ }));
    await user.click(screen.getByRole('button', { name: '이 업체로 할게요' }));
    await user.click(screen.getByRole('button', { name: '다음' }));
    expect(screen.getByRole('alert')).toHaveTextContent('주소를 적어 주세요.');
    await user.type(screen.getByLabelText('주소 (구·동까지)'), '마포구');
    await user.type(screen.getByLabelText('상세 주소'), '101호');
    await user.type(screen.getByLabelText('연락처'), '1234');
    await user.click(screen.getByRole('button', { name: '다음' }));
    expect(screen.getByRole('alert')).toHaveTextContent('연락처를 010-0000-0000처럼 적어 주세요.');
    await user.clear(screen.getByLabelText('연락처'));
    await user.type(screen.getByLabelText('연락처'), '01012345678');
    await user.click(screen.getByRole('button', { name: '다음' }));
    await user.click(screen.getByRole('button', { name: '예약하기 (체험)' }));
    await user.click(screen.getByRole('button', { name: '작업 날 미리 보기' }));
    await user.click(screen.getByRole('button', { name: '작업 시작 (업체가 누름)' }));
    await user.click(screen.getByRole('button', { name: '작업 끝 (업체가 누름)' }));
    await user.click(screen.getByRole('button', { name: '직접 확인하기' }));
    const [first, ...rest] = screen.getAllByRole('group');
    await user.click(within(first).getByRole('radio', { name: '예' }));
    for (const group of rest) await user.click(within(group).getByRole('radio', { name: '아니요' }));
    await user.click(screen.getByRole('button', { name: '1곳 다시 해 달라고 하기' }));
    expect(screen.getByRole('status')).toHaveTextContent('추가요금 없이 다시 해요.');
  });

  it('TEST-CL-FLOW-003 warns to clean a day earlier when no start time fits before the truck', async () => {
    const user = await toDateStep();
    await user.click(screen.getByRole('button', { name: /10월 19일/ }));
    await user.selectOptions(screen.getByLabelText(/이삿짐이 들어오는 시간/), '12');
    expect(screen.getByRole('alert')).toHaveTextContent('하루 전에 청소하는 것을 권해요.');
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
  });
});
