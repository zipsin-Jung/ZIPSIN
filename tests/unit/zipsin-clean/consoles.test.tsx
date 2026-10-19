import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AdminConsole } from '@/features/zipsin-clean/components/AdminConsole';
import { MyCleanPage } from '@/features/zipsin-clean/components/MyCleanPage';
import { PartnerConsole } from '@/features/zipsin-clean/components/PartnerConsole';
import type { AdminBooking, AdminPartner, CustomerBooking, MyRecord, PartnerJob, VisitRequest } from '@/features/zipsin-clean/domain/types';

const ok = <T,>(value: T) => ({ ok: true as const, value });
const facts = { service: 'move_in' as const, areaPyeong: 24, rooms: 3, baths: 2, balcony: 'expanded' as const, builtAge: 'mid' as const, occupancy: 'just_left' as const, pets: 'no' as const, smoking: 'no' as const };
const baseBooking = {
  service: 'move_in' as const, facts, areaPyeong: 24, grade: 1, people: 2, hours: 7, priceWon: 325000, includes: ['방·거실 바닥·벽·창틀'],
  areaDistrict: '마포구 공덕동', serviceDate: '2026-10-20', startHour: 9, arrivalHour: 17, requests: ['아이가 살고 있어요'], partnerNote: null, portfolioConsent: false, photos: [],
};
const booking = (over: Partial<CustomerBooking>): CustomerBooking => ({ ...baseBooking, id: 'b1', status: 'requested', partnerName: '초록손 청소', detailAddress: '101동', memo: '', blockReason: null, ...over });
const job = (over: Partial<PartnerJob>): PartnerJob => ({ ...baseBooking, id: 'j1', status: 'requested', memo: '락스는 빼 주세요', detailAddress: null, contactPhone: null, ...over });
const photo = () => new File(['x'], '거실.jpg', { type: 'image/jpeg' });

describe('MyCleanPage — 손님 마이페이지', () => {
  const setup = (bookings: CustomerBooking[], records: MyRecord[] = [], visits: VisitRequest[] = []) => {
    const props = {
      bookings, records, visits,
      act: vi.fn(async () => ok({ status: 'x' })), addRecord: vi.fn(async () => ok({ recordId: 'r9' })), removeRecord: vi.fn(async () => ok(undefined)),
      upload: vi.fn(async () => null), refresh: vi.fn(),
    };
    render(<MyCleanPage {...props} />);
    return { user: userEvent.setup(), props };
  };

  it('TEST-CL-MY-001 cancels a requested booking only after a second confirmation', async () => {
    const { user, props } = setup([booking({})]);
    const card = screen.getByRole('article', { name: '10월 20일 입주 청소 · 24평' });
    expect(card).toHaveTextContent('업체 수락 기다림');
    expect(card).toHaveTextContent('예상 가격 (수락하면 확정)');
    await user.click(within(card).getByRole('button', { name: '예약 취소하기' }));
    await user.click(within(card).getByRole('button', { name: '아니요' }));
    expect(props.act).not.toHaveBeenCalled();
    await user.click(within(card).getByRole('button', { name: '예약 취소하기' }));
    await user.click(within(card).getByRole('button', { name: '예약 취소' }));
    expect(props.act).toHaveBeenCalledWith({ bookingId: 'b1', action: 'cancel' });
    expect(props.refresh).toHaveBeenCalled();
  });

  it('TEST-CL-MY-002 approves with optional photo consent, or asks for a free redo', async () => {
    const { user, props } = setup([booking({ status: 'done', partnerNote: '순한 세제만 썼어요', photos: [{ id: 'p1', kind: 'after', url: 'https://example.test/a.jpg' }, { id: 'p2', kind: 'before', url: null }] })]);
    expect(screen.getByText('순한 세제만 썼어요')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '청소 후' })).toBeInTheDocument();
    expect(screen.getByText('볼 수 없음')).toBeInTheDocument();
    const approve = screen.getByRole('button', { name: '검수 완료' });
    expect(approve).toBeDisabled();
    for (const group of screen.getAllByRole('group')) await user.click(within(group).getByRole('radio', { name: '아니요' }));
    await user.click(screen.getByRole('checkbox', { name: /다른 손님에게 보여 줘도 괜찮아요/ }));
    await user.click(approve);
    expect(props.act).toHaveBeenCalledWith({ bookingId: 'b1', action: 'approve', answers: { hood: 'no', drain: 'no', rail: 'no' }, consent: true });
    await user.click(within(screen.getAllByRole('group')[0]).getByRole('radio', { name: '예' }));
    await user.click(screen.getByRole('button', { name: '1곳 다시 해 달라고 하기 (추가요금 없음)' }));
    expect(props.act).toHaveBeenLastCalledWith({ bookingId: 'b1', action: 'request_redo', answers: { hood: 'yes', drain: 'no', rail: 'no' } });
  });

  it('TEST-CL-MY-003 shows server errors and status notices for blocked, declined and completed bookings', async () => {
    const { user, props } = setup([
      booking({ id: 'a', status: 'accepted' }),
      booking({ id: 'b', status: 'block_reported', blockReason: '화재·그을음', serviceDate: '2026-10-21' }),
      booking({ id: 'c', status: 'declined', serviceDate: '2026-10-22' }),
      booking({ id: 'd', status: 'completed', serviceDate: '2026-10-10' }),
    ]);
    props.act.mockResolvedValueOnce({ ok: false, error: '이미 다른 단계로 넘어갔어요.' } as never);
    const accepted = screen.getByRole('article', { name: '10월 20일 입주 청소 · 24평' });
    await user.click(within(accepted).getByRole('button', { name: '예약 취소하기' }));
    await user.click(within(accepted).getByRole('button', { name: '예약 취소' }));
    expect(within(accepted).getByRole('alert')).toHaveTextContent('이미 다른 단계로 넘어갔어요.');
    expect(screen.getByText(/화재·그을음.*시작할 수 없다고/)).toBeInTheDocument();
    expect(screen.getByText(/다른 업체로 다시 예약해 주세요/)).toBeInTheDocument();
    const done = screen.getByRole('article', { name: '10월 10일 입주 청소 · 24평' });
    expect(done).toHaveTextContent('+ 추가요금 작업 시작 뒤0원');
    expect(screen.getByRole('heading', { name: /진행 중인 예약/ })).toHaveTextContent('2');
  });

  it('TEST-CL-MY-004 adds a past cleaning record, uploads photos to it, and deletes it', async () => {
    const records: MyRecord[] = [{ id: 'r1', doneMonth: '2024-02-01', service: '입주·이사 청소', partnerName: '동네 업체', areaDistrict: '서대문구', priceWon: 370000, memo: '현장에서 17만 원 더', photos: [] }];
    const { user, props } = setup([], records, [{ id: 'v1', kind: 'special', special: ['화재·그을음'], note: '', areaDistrict: '마포구', visitDate: '2026-10-21', slot: '오전', contactPhone: '010-0000-0000', status: 'requested', createdAt: '' }]);
    expect(screen.getByText('진행 중인 예약이 없어요.')).toBeInTheDocument();
    expect(screen.getByText(/특수 청소 · 화재·그을음/)).toBeInTheDocument();
    expect(screen.getByText(/집신 확인 중/)).toBeInTheDocument();
    const card = screen.getByRole('article', { name: '2024년 2월 입주·이사 청소' });
    expect(card).toHaveTextContent('낸 금액370,000원');
    await user.upload(within(card).getByLabelText('사진 추가'), photo());
    expect(props.upload).toHaveBeenCalledWith({ kind: 'record', recordId: 'r1' }, [expect.any(File)]);
    await user.click(within(card).getByRole('button', { name: '이 기록 지우기' }));
    await user.click(within(card).getByRole('button', { name: '지우기' }));
    expect(props.removeRecord).toHaveBeenCalledWith('r1');

    await user.click(screen.getByRole('button', { name: '예전 청소 남기기' }));
    await user.click(screen.getByRole('button', { name: '남기기' }));
    expect(screen.getByRole('alert')).toHaveTextContent('언제, 어느 업체, 어디인지 적어 주세요.');
    const form = screen.getByRole('region', { name: '예전 청소 남기기' });
    await user.type(within(form).getByLabelText('언제'), '2025-06');
    await user.type(within(form).getByLabelText('어느 업체·누가 했나요'), '동네 이모님');
    await user.type(within(form).getByLabelText('어디 (구·동)'), '마포구 망원동');
    await user.type(within(form).getByLabelText('낸 금액 (선택)'), '60,000');
    await user.type(within(form).getByLabelText('메모 (선택)'), '꼼꼼했어요');
    await user.click(screen.getByRole('button', { name: '남기기' }));
    expect(props.addRecord).toHaveBeenCalledWith({ month: '2025-06', service: '입주·이사 청소', partnerName: '동네 이모님', areaDistrict: '마포구 망원동', priceWon: 60000, memo: '꼼꼼했어요' });
    expect(screen.queryByRole('region', { name: '예전 청소 남기기' })).not.toBeInTheDocument();
  });

  it('TEST-CL-MY-005 keeps the form open with the server error and closes on demand', async () => {
    const { user, props } = setup([]);
    props.addRecord.mockResolvedValueOnce({ ok: false, error: '입력한 내용을 확인해 주세요.' } as never);
    expect(screen.getByText(/아직 기록이 없어요/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '예전 청소 남기기' }));
    const form = screen.getByRole('region', { name: '예전 청소 남기기' });
    await user.type(within(form).getByLabelText('언제'), '2025-06');
    await user.type(within(form).getByLabelText('어느 업체·누가 했나요'), '이모님');
    await user.type(within(form).getByLabelText('어디 (구·동)'), '마포구');
    await user.click(screen.getByRole('button', { name: '남기기' }));
    expect(screen.getByRole('alert')).toHaveTextContent('입력한 내용을 확인해 주세요.');
    await user.click(screen.getByRole('button', { name: '닫기' }));
    expect(screen.queryByRole('region', { name: '예전 청소 남기기' })).not.toBeInTheDocument();
  });
});

describe('PartnerConsole — 업체 화면', () => {
  const setup = (jobs: PartnerJob[], partnerName: string | null = '초록손 청소') => {
    const props = { partnerName, jobs, redeem: vi.fn(async () => ok(undefined)), act: vi.fn(async () => ok({ status: 'x' })), upload: vi.fn(async () => null), refresh: vi.fn() };
    render(<PartnerConsole {...props} />);
    return { user: userEvent.setup(), props };
  };

  it('TEST-CL-PARTNER-001 asks for an invite code when the account is not a partner yet', async () => {
    const { user, props } = setup([], null);
    props.redeem.mockResolvedValueOnce({ ok: false, error: '초대 코드가 맞지 않거나 이미 쓰였거나 기간이 지났어요.' } as never);
    const start = screen.getByRole('button', { name: '초대 코드로 시작하기' });
    expect(start).toBeDisabled();
    await user.type(screen.getByLabelText('초대 코드'), 'abc123def0');
    await user.click(start);
    expect(screen.getByRole('alert')).toHaveTextContent('이미 쓰였거나');
    await user.click(start);
    expect(props.redeem).toHaveBeenLastCalledWith('abc123def0');
    expect(props.refresh).toHaveBeenCalled();
  });

  it('TEST-CL-PARTNER-002 shows only district, requests and memo before accepting', async () => {
    const { user, props } = setup([job({})]);
    expect(screen.getByRole('tab', { name: '작업 요청 1' })).toHaveAttribute('aria-selected', 'true');
    await user.click(screen.getByRole('button', { name: /마포구 공덕동/ }));
    expect(screen.getByRole('region', { name: '주소와 연락처' })).toHaveTextContent('상세 주소와 연락처는 수락하면 보여요.');
    const requests = screen.getByRole('region', { name: '손님 요청' });
    expect(requests).toHaveTextContent('아이가 살고 있어요');
    expect(requests).toHaveTextContent('락스는 빼 주세요');
    expect(requests).toHaveTextContent('수락하면 이 요청도 지키기로 한 거예요');
    expect(screen.getByText('가격 (수락하면 확정)')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '이 가격으로 수락하기' }));
    expect(props.act).toHaveBeenCalledWith({ bookingId: 'j1', action: 'accept' });
    await user.click(screen.getByRole('button', { name: '이번엔 못 해요' }));
    expect(props.act).toHaveBeenLastCalledWith({ bookingId: 'j1', action: 'decline' });
    await user.click(screen.getByRole('button', { name: '뒤로' }));
    expect(screen.getByRole('heading', { name: '작업 요청' })).toBeInTheDocument();
  });

  it('TEST-CL-PARTNER-003 reports a blocked house only with a reason and a photo, never an extra charge', async () => {
    const { user, props } = setup([job({ status: 'accepted', detailAddress: '예시아파트 101동', contactPhone: '010-0000-0000' })]);
    await user.click(screen.getByRole('button', { name: /마포구 공덕동/ }));
    expect(screen.getByRole('region', { name: '주소와 연락처' })).toHaveTextContent('예시아파트 101동');
    expect(screen.queryByRole('button', { name: /추가요금|예약과 달라요/ })).not.toBeInTheDocument();
    await user.upload(screen.getAllByLabelText('사진 올리기')[0], photo());
    expect(props.upload).toHaveBeenCalledWith({ kind: 'before', bookingId: 'j1' }, [expect.any(File)]);
    await user.click(screen.getByRole('button', { name: '청소를 시작할 수 없는 집이에요' }));
    const send = screen.getByRole('button', { name: '집신에 보내기' });
    expect(send).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: '이삿짐이 아직 안 빠짐' }));
    expect(send).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '닫기' }));
    await user.click(screen.getByRole('button', { name: '작업 시작' }));
    expect(props.act).toHaveBeenCalledWith({ bookingId: 'j1', action: 'start' });
  });

  it('TEST-CL-PARTNER-004 sends the block report once a photo is attached', async () => {
    const { user, props } = setup([job({ status: 'accepted', detailAddress: 'x', contactPhone: '010-0000-0000', photos: [{ id: 'k', kind: 'block', url: 'https://example.test/k.jpg' }] })]);
    await user.click(screen.getByRole('button', { name: /마포구 공덕동/ }));
    await user.click(screen.getByRole('button', { name: '청소를 시작할 수 없는 집이에요' }));
    await user.click(screen.getByRole('radio', { name: '기타' }));
    expect(screen.getByRole('button', { name: '집신에 보내기' })).toBeDisabled();
    await user.type(screen.getByLabelText('어떤 상황인지 적어 주세요'), '현관 비밀번호가 바뀜');
    await user.click(screen.getByRole('button', { name: '집신에 보내기' }));
    expect(props.act).toHaveBeenCalledWith({ bookingId: 'j1', action: 'report_block', reason: '기타', note: '현관 비밀번호가 바뀜' });
  });

  it('TEST-CL-PARTNER-005 finishes only with an after photo and passes the note to the customer', async () => {
    const first = setup([job({ status: 'working', detailAddress: 'x', contactPhone: 'y' })]);
    await first.user.click(screen.getByRole('button', { name: /마포구 공덕동/ }));
    expect(screen.getByText(/추가요금 버튼은 없어요/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '작업 끝 · 손님에게 검수 요청' })).toBeDisabled();
    await first.user.upload(screen.getByLabelText('사진 올리기'), photo());
    expect(first.props.upload).toHaveBeenCalledWith({ kind: 'after', bookingId: 'j1' }, [expect.any(File)]);
  });

  it('TEST-CL-PARTNER-006 redo and finish with note; shows notices for done, blocked, completed', async () => {
    const { user, props } = setup([
      job({ id: 'r', status: 'redo', detailAddress: 'x', contactPhone: 'y', photos: [{ id: 'a', kind: 'after', url: 'https://example.test/a.jpg' }] }),
      job({ id: 'd', status: 'done', areaDistrict: '은평구 응암동', detailAddress: 'x', contactPhone: 'y' }),
      job({ id: 'k', status: 'block_reported', areaDistrict: '서대문구', detailAddress: 'x', contactPhone: 'y' }),
    ]);
    await user.click(screen.getByRole('button', { name: /마포구 공덕동/ }));
    expect(screen.getByText(/다시 해 달라고 했어요/)).toBeInTheDocument();
    await user.type(screen.getByLabelText('손님에게 남길 말 (선택)'), '배수구가 느려요');
    await user.click(screen.getByRole('button', { name: '작업 끝 · 손님에게 검수 요청' }));
    expect(props.act).toHaveBeenCalledWith({ bookingId: 'r', action: 'finish', note: '배수구가 느려요' });
    await user.click(screen.getByRole('button', { name: '뒤로' }));
    await user.click(screen.getByRole('button', { name: /은평구 응암동/ }));
    expect(screen.getByText(/손님이 검수하고 있어요/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '뒤로' }));
    await user.click(screen.getByRole('button', { name: /서대문구/ }));
    expect(screen.getByText(/집신이 사진을 확인하고 있어요/)).toBeInTheDocument();
  });

  it('TEST-CL-PARTNER-007 work log hides private info again and shows consent', async () => {
    const { user } = setup([
      job({ id: 'c1', status: 'completed', memo: '', requests: [], portfolioConsent: true, photos: [{ id: 'a', kind: 'after', url: 'https://example.test/a.jpg' }, { id: 'k', kind: 'block', url: 'https://example.test/k.jpg' }] }),
      job({ id: 'c2', status: 'completed', areaDistrict: '은평구', memo: '', requests: [] }),
    ]);
    expect(screen.getByText(/알림 없이 여기에 생겨요/)).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: '내 작업 기록 2' }));
    const shared = screen.getByRole('article', { name: '10월 20일 마포구 공덕동' });
    expect(shared).toHaveTextContent('손님 동의 · 다른 손님에게 보임');
    expect(within(shared).getAllByRole('img')).toHaveLength(1);
    expect(screen.getByRole('article', { name: '10월 20일 은평구' })).toHaveTextContent('손님 동의 안 함 · 나만 보임');
    await user.click(screen.getByRole('tab', { name: '작업 요청 0' }));
    expect(screen.getByText(/지금은 들어온 요청이 없어요/)).toBeInTheDocument();
  });
});

describe('AdminConsole — 집신 운영자', () => {
  const partners: AdminPartner[] = [
    { id: 'p1', name: '초록손 청소', kind: 'company', area: '마포', team: '정직원 팀', checks: [], status: 'active', memberCount: 1 },
    { id: 'p2', name: '반듯 홈케어', kind: 'individual', area: '', team: '', checks: [], status: 'suspended', memberCount: 0 },
  ];
  const bookings: AdminBooking[] = [
    { id: 'b1', status: 'block_reported', partnerName: '초록손 청소', areaDistrict: '마포구', serviceDate: '2026-10-20', priceWon: 325000, blockReason: '화재·그을음', blockNote: '베란다', createdAt: '2026-10-19T00:00:00Z' },
    { id: 'b2', status: 'completed', partnerName: '초록손 청소', areaDistrict: '은평구', serviceDate: '2026-10-10', priceWon: 200000, blockReason: null, blockNote: null, createdAt: '2026-10-09T00:00:00Z' },
  ];
  const visits: VisitRequest[] = [{ id: 'v1', kind: 'special', special: ['유품 정리'], note: '짐이 많아요', areaDistrict: '마포구', visitDate: '2026-10-22', slot: '오후', contactPhone: '010-0000-0000', status: 'requested', createdAt: '' }];
  const setup = (over: Partial<{ partners: AdminPartner[]; bookings: AdminBooking[]; visits: VisitRequest[] }> = {}) => {
    const props = {
      partners, bookings, visits, ...over,
      createPartner: vi.fn(async () => ok({ partnerId: 'p9' })), createInvite: vi.fn(async () => ok({ code: '3F9A1C0B2D' })),
      setStatus: vi.fn(async () => ok(undefined)), act: vi.fn(async () => ok({ status: 'cancelled' })), refresh: vi.fn(),
    };
    render(<AdminConsole {...props} />);
    return { user: userEvent.setup(), props };
  };

  it('TEST-CL-ADMIN-001 registers a partner and shows a one-time invite code', async () => {
    const { user, props } = setup();
    expect(screen.getByRole('status')).toHaveTextContent('시작 불가 신고 1건');
    await user.type(screen.getByLabelText('업체·이름'), '맑은집');
    await user.selectOptions(screen.getByLabelText('종류'), 'individual');
    await user.type(screen.getByLabelText('지역'), '용산');
    await user.click(screen.getByRole('button', { name: '업체 등록' }));
    expect(props.createPartner).toHaveBeenCalledWith({ name: '맑은집', kind: 'individual', area: '용산', team: '', checks: ['대표 대면', '현장 동행'] });
    const card = screen.getByRole('article', { name: '초록손 청소' });
    await user.click(within(card).getByRole('button', { name: '초대 코드 만들기' }));
    expect(within(card).getByText('3F9A1C0B2D')).toBeInTheDocument();
    await user.click(within(card).getByRole('button', { name: '잠시 멈춤' }));
    expect(props.setStatus).toHaveBeenCalledWith('p1', 'suspended');
    await user.click(within(card).getByRole('button', { name: '레드카드(퇴출)' }));
    expect(props.setStatus).toHaveBeenLastCalledWith('p1', 'red_card');
    await user.click(within(screen.getByRole('article', { name: '반듯 홈케어' })).getByRole('button', { name: '다시 받기' }));
    expect(props.setStatus).toHaveBeenLastCalledWith('p2', 'active');
  });

  it('TEST-CL-ADMIN-002 confirms a no-penalty cancel and lists visit requests with contact', async () => {
    const { user, props } = setup();
    props.act.mockResolvedValueOnce({ ok: false, error: '이미 다른 단계로 넘어갔어요.' } as never);
    await user.click(screen.getByRole('tab', { name: '예약 2' }));
    expect(screen.getByText(/사유: 화재·그을음 · 베란다/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '확인함 · 위약금 없이 취소' }));
    expect(screen.getByRole('alert')).toHaveTextContent('이미 다른 단계로 넘어갔어요.');
    await user.click(screen.getByRole('button', { name: '확인함 · 위약금 없이 취소' }));
    expect(props.act).toHaveBeenLastCalledWith({ bookingId: 'b1', action: 'confirm_block' });
    expect(props.refresh).toHaveBeenCalled();
    await user.click(screen.getByRole('tab', { name: '방문 요청 1' }));
    expect(screen.getByText('특수 청소 · 유품 정리')).toBeInTheDocument();
    expect(screen.getByText('010-0000-0000')).toBeInTheDocument();
  });

  it('TEST-CL-ADMIN-003 shows empty states', async () => {
    const { user } = setup({ partners: [], bookings: [], visits: [] });
    await user.click(screen.getByRole('tab', { name: '예약 0' }));
    expect(screen.getByText('아직 예약이 없어요.')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: '방문 요청 0' }));
    expect(screen.getByText('아직 방문 견적 요청이 없어요.')).toBeInTheDocument();
  });
});
