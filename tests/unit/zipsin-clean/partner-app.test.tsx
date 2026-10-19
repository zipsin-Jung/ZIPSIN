import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CleanPartnerPage from '@/app/cl/partner/page';
import { PartnerApp } from '@/features/zipsin-clean/components/PartnerApp';

const today = new Date(2026, 9, 18);
afterEach(() => vi.unstubAllEnvs());

async function openFirstJob() {
  const user = userEvent.setup();
  render(<PartnerApp today={today} />);
  expect(screen.getByRole('heading', { level: 1, name: '집신이 초대한 업체만 들어와요' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '초대 수락하고 시작하기 (체험)' }));
  await user.click(screen.getByRole('button', { name: /마포구 공덕동/ }));
  return user;
}

describe('PartnerApp — 업체 화면 (체험)', () => {
  it('TEST-CL-PARTNER-001 hides address and contact until accepted, and hides them again after payment', async () => {
    const user = await openFirstJob();
    const contact = () => screen.getByRole('region', { name: '주소와 연락처' });
    expect(contact()).toHaveTextContent('마포구 공덕동');
    expect(contact()).not.toHaveTextContent('1203호');
    expect(contact()).not.toHaveTextContent('010-');
    expect(screen.getByText('가격 (수락하면 확정)')).toBeInTheDocument();
    const requests = () => screen.getByRole('region', { name: '손님 요청' });
    expect(requests()).toHaveTextContent('아이가 살고 있어요');
    expect(requests()).toHaveTextContent('락스처럼 냄새가 독한 세제는 빼고 해 주세요.');
    expect(requests()).toHaveTextContent('수락하면 이 요청도 지키기로 한 거예요');

    await user.click(screen.getByRole('button', { name: '이 가격으로 수락하기' }));
    expect(contact()).toHaveTextContent('예시아파트 101동 1203호 (예시)');
    expect(screen.getByText('확정 가격')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '작업 시작' }));
    expect(screen.getByText(/추가요금 버튼은 없어요/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /추가요금/ })).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('손님에게 남길 말 (선택)'), '순한 세제만 썼어요.');
    await user.click(screen.getByRole('button', { name: '작업 끝 · 완료 사진 올리기 (체험)' }));
    expect(screen.getByText('손님에게 남긴 말')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '손님 검수 완료 보기 (체험)' }));

    expect(screen.getByRole('region', { name: '정산' })).toHaveTextContent('+ 추가요금0원');
    expect(screen.getByRole('region', { name: '정산' })).not.toHaveTextContent('수수료');
    expect(contact()).not.toHaveTextContent('1203호');
    expect(contact()).toHaveTextContent('다시 가렸어요');
    expect(requests()).not.toHaveTextContent('아이가 살고 있어요');
    expect(requests()).toHaveTextContent('손님 요청도 다시 가렸어요');
    await user.click(screen.getByRole('button', { name: '요청 목록으로' }));
    expect(screen.getByRole('button', { name: /마포구 공덕동/ })).toHaveTextContent('정산 완료');
  });

  it('TEST-CL-PARTNER-002 has no on-site recalculation; a blocked house can only be cancelled', async () => {
    const user = await openFirstJob();
    await user.click(screen.getByRole('button', { name: '이 가격으로 수락하기' }));
    expect(screen.queryByRole('button', { name: /예약과 달라요|다시 계산/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '청소를 시작할 수 없는 집이에요' }));
    const send = screen.getByRole('button', { name: '사진과 함께 집신에 보내기 (체험)' });
    expect(send).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: '기타' }));
    expect(send).toBeDisabled();
    await user.type(screen.getByLabelText('어떤 상황인지 적어 주세요'), '현관 비밀번호가 바뀜');
    expect(send).toBeEnabled();
    await user.click(screen.getByRole('radio', { name: '이삿짐이 아직 안 빠짐' }));
    await user.click(send);
    expect(screen.getByRole('status')).toHaveTextContent('위약금 없이 취소');
    expect(screen.getByRole('status')).toHaveTextContent('추가요금을 받고 진행하는 방법은 없어요');
    expect(screen.queryByRole('button', { name: '작업 시작' })).not.toBeInTheDocument();
  });

  it('TEST-CL-PARTNER-003 lets a partner decline a request', async () => {
    const user = await openFirstJob();
    await user.click(screen.getByRole('button', { name: '이번엔 못 해요' }));
    expect(screen.queryByRole('button', { name: /마포구 공덕동/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /서대문구 북아현동/ }));
    expect(screen.getByRole('region', { name: '손님 요청' })).toHaveTextContent('엘리베이터가 없어요');
    await user.click(screen.getByRole('button', { name: '이번엔 못 해요' }));
    await user.click(screen.getByRole('button', { name: /마포구 망원동/ }));
    await user.click(screen.getByRole('button', { name: '이번엔 못 해요' }));
    expect(screen.getByText('지금은 들어온 요청이 없어요.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '뒤로' }));
    expect(screen.getByRole('heading', { level: 1, name: '집신이 초대한 업체만 들어와요' })).toBeInTheDocument();
  });

  it('TEST-CL-PARTNER-004 shows only the preparing screen on the live site', () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    render(<CleanPartnerPage />);
    expect(screen.getByRole('heading', { level: 1, name: /집 청소는 집신청소에서/ })).toBeInTheDocument();
  });

  it('TEST-CL-PARTNER-005 opens the partner demo on Preview with a link back to the customer view', () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    render(<CleanPartnerPage />);
    expect(screen.getByRole('link', { name: '손님 화면' })).toHaveAttribute('href', '/cl');
  });
});
