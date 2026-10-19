import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BookingFlow, makeIdempotencyKey, type BookingFlowProps } from '@/features/zipsin-clean/components/BookingFlow';
import type { PartnerOption } from '@/features/zipsin-clean/domain/types';

const today = new Date(2026, 9, 18);
const partners: PartnerOption[] = [
  { id: '11111111-1111-4111-8111-111111111111', name: '초록손 청소', kind: 'company', area: '마포·서대문', team: '정직원 팀', checks: ['대표 대면'], completedCount: 3, samplePhotos: [{ id: 's1', kind: 'after', url: 'https://example.test/a.jpg' }] },
  { id: '22222222-2222-4222-8222-222222222222', name: '반듯 홈케어', kind: 'individual', area: '은평', team: '', checks: [], completedCount: 0, samplePhotos: [] },
];

function setup(overrides: Partial<BookingFlowProps> = {}) {
  const props: BookingFlowProps = {
    partners, signedIn: true, phoneVerified: true, loginHref: '/login?next=%2Fcl', verifyHref: '/signup/verify',
    submitBooking: vi.fn(async () => ({ ok: true as const, value: { bookingId: 'b1' } })),
    submitVisit: vi.fn(async () => ({ ok: true as const, value: undefined })),
    onBooked: vi.fn(), today, newKey: vi.fn(() => '33333333-3333-4333-8333-333333333333'),
    ...overrides,
  };
  const user = userEvent.setup();
  render(<BookingFlow {...props} />);
  return { user, props };
}

async function toConfirm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: '가격 보기' }));
  await user.click(screen.getByRole('button', { name: '이 가격으로 예약하기' }));
  await user.click(screen.getByRole('button', { name: /10월 19일/ }));
  await user.selectOptions(screen.getByLabelText(/이삿짐이 들어오는 시간/), '17');
  expect(screen.getByRole('button', { name: /오전 10시 시작/ })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: '오전 9시 시작' }));
  await user.click(screen.getByRole('button', { name: '다음' }));
  expect(screen.getByText(/가격은 모두 같아요/)).toBeInTheDocument();
  expect(screen.getByRole('img', { name: '이 업체의 청소 후 사진' })).toBeInTheDocument();
  expect(screen.getByText('개인 · 집신 완료 0건')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /초록손 청소/ }));
  await user.click(screen.getByRole('button', { name: '이 업체로 할게요' }));
  await user.click(screen.getByRole('button', { name: '다음' }));
  expect(screen.getByRole('alert')).toHaveTextContent('주소를 적어 주세요.');
  await user.type(screen.getByLabelText('주소 (구·동까지)'), '마포구 공덕동');
  await user.type(screen.getByLabelText('상세 주소'), '101동 1203호');
  await user.type(screen.getByLabelText('연락처'), '1234');
  await user.click(screen.getByRole('button', { name: '다음' }));
  expect(screen.getByRole('alert')).toHaveTextContent('연락처를 010-0000-0000처럼 적어 주세요.');
  await user.clear(screen.getByLabelText('연락처'));
  await user.type(screen.getByLabelText('연락처'), '010-0000-0000');
  await user.click(screen.getByRole('checkbox', { name: '아이가 살고 있어요' }));
  await user.type(screen.getByLabelText('메모'), '락스는 빼 주세요');
  await user.click(screen.getByRole('button', { name: '다음' }));
}

describe('BookingFlow — 손님 예약 (실제 저장)', () => {
  it('TEST-CL-BOOK-001 sends facts, schedule and contact but never a price', async () => {
    const { user, props } = setup();
    await toConfirm(user);
    expect(screen.getByRole('heading', { name: '예약 내용을 확인해 주세요' })).toBeInTheDocument();
    expect(screen.getByText('아이가 살고 있어요 · 락스는 빼 주세요')).toBeInTheDocument();
    expect(screen.getByText(/집신 앱으로 결제하지 않아요/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '예약 요청하기' }));
    expect(props.submitBooking).toHaveBeenCalledOnce();
    const payload = vi.mocked(props.submitBooking).mock.calls[0][0];
    expect(payload).toMatchObject({ partnerId: partners[0].id, serviceDate: '2026-10-19', startHour: 9, arrivalHour: 17, areaDistrict: '마포구 공덕동', detailAddress: '101동 1203호', contactPhone: '010-0000-0000', requests: ['아이가 살고 있어요'], memo: '락스는 빼 주세요', idempotencyKey: '33333333-3333-4333-8333-333333333333' });
    expect(JSON.stringify(payload)).not.toMatch(/price|325000/i);
    expect(props.onBooked).toHaveBeenCalledOnce();
  });

  it('TEST-CL-BOOK-002 shows the server error and gets a fresh key for the retry', async () => {
    const submitBooking = vi.fn(async () => ({ ok: false as const, error: '지금은 이 업체를 고를 수 없어요. 다른 업체를 골라 주세요.' }));
    const { user, props } = setup({ submitBooking });
    await toConfirm(user);
    await user.click(screen.getByRole('button', { name: '예약 요청하기' }));
    expect(screen.getByRole('alert')).toHaveTextContent('다른 업체를 골라 주세요');
    expect(props.onBooked).not.toHaveBeenCalled();
    expect(props.newKey).toHaveBeenCalledTimes(2);
  });

  it('TEST-CL-BOOK-003 asks to log in or verify the phone before booking', async () => {
    const { user } = setup({ signedIn: false });
    await toConfirm(user);
    expect(screen.getByRole('link', { name: '로그인하기' })).toHaveAttribute('href', '/login?next=%2Fcl');
    expect(screen.getByRole('button', { name: '예약 요청하기' })).toBeDisabled();
  });

  it('TEST-CL-BOOK-006 shows the login prompt (not "no partners") when signed out', async () => {
    const { user } = setup({ signedIn: false, partners: [] });
    await user.click(screen.getByRole('button', { name: '가격 보기' }));
    await user.click(screen.getByRole('button', { name: '이 가격으로 예약하기' }));
    await user.click(screen.getByRole('button', { name: /10월 19일/ }));
    await user.click(screen.getByRole('button', { name: '오전 8시 시작' }));
    await user.click(screen.getByRole('button', { name: '다음' }));
    expect(screen.queryByText(/지금 예약을 받는 업체가 없어요/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '로그인하기' })).toBeInTheDocument();
  });

  it('TEST-CL-BOOK-004 asks for phone verification when the account is not verified', async () => {
    const { user } = setup({ phoneVerified: false });
    await toConfirm(user);
    expect(screen.getByRole('link', { name: '인증하기' })).toHaveAttribute('href', '/signup/verify');
    expect(screen.getByRole('button', { name: '예약 요청하기' })).toBeDisabled();
  });

  it('TEST-CL-BOOK-005 warns to clean a day earlier when nothing fits, and says when no partner is open', async () => {
    const { user } = setup({ partners: [] });
    await user.click(screen.getByRole('button', { name: '가격 보기' }));
    await user.click(screen.getByRole('button', { name: '이 가격으로 예약하기' }));
    await user.click(screen.getByRole('button', { name: /10월 19일/ }));
    await user.selectOptions(screen.getByLabelText(/이삿짐이 들어오는 시간/), '12');
    expect(screen.getByRole('alert')).toHaveTextContent('하루 전에 청소하는 것을 권해요.');
    await user.selectOptions(screen.getByLabelText(/이삿짐이 들어오는 시간/), '');
    await user.click(screen.getByRole('button', { name: '오전 8시 시작' }));
    await user.click(screen.getByRole('button', { name: '다음' }));
    expect(screen.getByText(/지금 예약을 받는 업체가 없어요/)).toBeInTheDocument();
    window.dispatchEvent(new PopStateEvent('popstate', { state: { cleanStep: 'date' } }));
    expect(await screen.findByRole('heading', { name: '언제 할까요?' })).toBeInTheDocument();
  });

  it('TEST-CL-VISIT-001 sends a special-cleaning visit request after checking each field', async () => {
    const { user, props } = setup();
    await user.click(screen.getByRole('button', { name: /특수 청소/ }));
    expect(screen.getByRole('radio', { name: /특수 청소/ })).toBeChecked();
    const send = () => user.click(screen.getByRole('button', { name: '방문 견적 요청하기' }));
    await send();
    expect(screen.getByRole('alert')).toHaveTextContent('어떤 특수 청소인지 골라 주세요.');
    await user.click(screen.getByRole('checkbox', { name: '화재·그을음' }));
    await user.click(screen.getByRole('checkbox', { name: '기타' }));
    await send();
    expect(screen.getByRole('alert')).toHaveTextContent('기타 상황을 적어 주세요.');
    await user.type(screen.getByLabelText('어떤 상황인지 적어 주세요'), '베란다 그을음');
    await send();
    expect(screen.getByRole('alert')).toHaveTextContent('주소를 구·동까지 적어 주세요.');
    await user.type(screen.getByLabelText('주소 (구·동까지)'), '마포구 공덕동');
    await send();
    expect(screen.getByRole('alert')).toHaveTextContent('방문 날짜와 시간대를 골라 주세요.');
    await user.click(screen.getByRole('button', { name: /10월 20일/ }));
    await user.click(screen.getByRole('button', { name: '오전' }));
    await user.type(screen.getByLabelText('연락처'), '12');
    await send();
    expect(screen.getByRole('alert')).toHaveTextContent('연락처를 010-0000-0000처럼 적어 주세요.');
    await user.clear(screen.getByLabelText('연락처'));
    await user.type(screen.getByLabelText('연락처'), '010-0000-0000');
    await send();
    expect(props.submitVisit).toHaveBeenCalledWith({ kind: 'special', special: ['화재·그을음', '기타'], note: '베란다 그을음', areaDistrict: '마포구 공덕동', visitDate: '2026-10-20', slot: '오전', contactPhone: '010-0000-0000' });
    expect(screen.getByRole('status')).toHaveTextContent('특수 청소 · 화재·그을음, 기타 · 마포구 공덕동 · 10월 20일 오전');
    await user.click(screen.getByRole('button', { name: '처음으로' }));
    expect(screen.getByRole('button', { name: '가격 보기' })).toBeInTheDocument();
  });

  it('TEST-CL-VISIT-002 shows the server error for a visit request and switches kinds', async () => {
    const submitVisit = vi.fn(async () => ({ ok: false as const, error: '로그인한 뒤 다시 해 주세요.' }));
    const { user } = setup({ submitVisit, signedIn: true });
    await user.click(screen.getByRole('button', { name: /방문 견적 요청/ }));
    await user.click(screen.getByRole('radio', { name: /특수 청소/ }));
    expect(screen.getByRole('checkbox', { name: '화재·그을음' })).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /생활 정리 청소/ }));
    expect(screen.queryByRole('checkbox', { name: '화재·그을음' })).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('주소 (구·동까지)'), '마포구');
    await user.click(screen.getByRole('button', { name: /10월 19일/ }));
    await user.click(screen.getByRole('button', { name: '오후' }));
    await user.type(screen.getByLabelText('연락처'), '01000000000');
    await user.click(screen.getByRole('button', { name: '방문 견적 요청하기' }));
    expect(screen.getByRole('alert')).toHaveTextContent('로그인한 뒤 다시 해 주세요.');
  });

  it('TEST-CL-VISIT-003 needs an account to send a visit request', async () => {
    const { user } = setup({ signedIn: false });
    await user.click(screen.getByRole('button', { name: /방문 견적 요청/ }));
    const region = screen.getByText(/예약하려면 집신 계정으로 로그인해야 해요/);
    expect(within(region).getByRole('link', { name: '로그인하기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '방문 견적 요청하기' })).toBeDisabled();
  });

  it('TEST-CL-BOOK-007 makes a valid booking key even without crypto.randomUUID', () => {
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    expect(makeIdempotencyKey()).toMatch(uuid);
    const original = crypto.randomUUID;
    Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true });
    try { expect(makeIdempotencyKey()).toMatch(uuid); } finally { Object.defineProperty(crypto, 'randomUUID', { value: original, configurable: true }); }
  });
});
