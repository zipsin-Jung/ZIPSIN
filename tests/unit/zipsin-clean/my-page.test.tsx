import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import CleanMyPageRoute from '@/app/cl/my/page';
import { CleanApp } from '@/features/zipsin-clean/components/CleanApp';
import { CleanMyPage } from '@/features/zipsin-clean/components/CleanMyPage';
import { PartnerApp } from '@/features/zipsin-clean/components/PartnerApp';
import type { CleanRecord } from '@/features/zipsin-clean/domain/demo';

beforeAll(() => { URL.createObjectURL = vi.fn(() => 'blob:demo'); });
afterEach(() => vi.unstubAllEnvs());
const photo = () => new File(['x'], '거실.jpg', { type: 'image/jpeg' });

describe('마이페이지 (체험)', () => {
  it('TEST-CL-MY-001 lists 집신 bookings and lets the customer add a past cleaning with photos', async () => {
    const user = userEvent.setup();
    render(<CleanMyPage />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('내 청소 기록 2');
    const zipsin = screen.getByRole('article', { name: '2026년 3월 입주 청소 · 24평' });
    expect(zipsin).toHaveTextContent('집신 예약');
    expect(zipsin).toHaveTextContent('+ 추가요금 작업 시작 뒤0원');
    await user.click(within(zipsin).getByRole('button', { name: '이 업체 다시 부르기' }));
    expect(within(zipsin).getByRole('status')).toHaveTextContent('체험이에요');

    await user.click(screen.getByRole('button', { name: '예전 청소 남기기' }));
    await user.click(screen.getByRole('button', { name: '남기기' }));
    expect(screen.getByRole('alert')).toHaveTextContent('언제, 어느 업체, 어디인지 적어 주세요.');
    const form = screen.getByRole('region', { name: '예전 청소 남기기' });
    await user.type(within(form).getByLabelText('언제'), '2025-06');
    await user.type(within(form).getByLabelText('어느 업체·누가 했나요'), '동네 이모님');
    await user.type(within(form).getByLabelText('어디 (구·동)'), '마포구 망원동');
    await user.type(within(form).getByLabelText('낸 금액 (선택)'), '60,000');
    await user.type(within(form).getByLabelText('메모 (선택)'), '꼼꼼했어요');
    await user.upload(within(form).getByLabelText('사진 추가'), photo());
    expect(within(form).getByRole('img', { name: '거실.jpg' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '남기기' }));

    const mine = screen.getByRole('article', { name: '2025년 6월 입주·이사 청소' });
    expect(mine).toHaveTextContent('직접 남긴 기록');
    expect(mine).toHaveTextContent('낸 금액60,000원');
    expect(mine).toHaveTextContent('꼼꼼했어요');
    expect(within(mine).getByRole('img', { name: '거실.jpg' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('내 청소 기록 3');
    expect(screen.getAllByRole('article').map((item) => item.getAttribute('aria-label'))).toEqual(['2026년 3월 입주 청소 · 24평', '2025년 6월 입주·이사 청소', '2024년 2월 이사 청소']);

    const old = screen.getByRole('article', { name: '2024년 2월 이사 청소' });
    await user.upload(within(old).getByLabelText('사진 추가'), photo());
    expect(within(old).getByRole('img', { name: '거실.jpg' })).toBeInTheDocument();
  });

  it('TEST-CL-MY-002 closes the form and shows extra records passed in', async () => {
    const user = userEvent.setup();
    const extra: CleanRecord = { id: 'x', sortKey: '2026-10-20', date: '10월 20일', service: '입주 청소 · 24평', area: '마포구 공덕동', partner: '초록손 청소 (예시)', priceWon: 325000, viaZipsin: true, photos: [] };
    render(<CleanMyPage extra={[extra]} />);
    expect(screen.getByRole('article', { name: '10월 20일 입주 청소 · 24평' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '예전 청소 남기기' }));
    await user.click(screen.getByRole('button', { name: '닫기' }));
    expect(screen.queryByRole('region', { name: '예전 청소 남기기' })).not.toBeInTheDocument();
  });

  it('TEST-CL-MY-003 hands the finished booking to the my page without the customer memo', async () => {
    const user = userEvent.setup();
    const saved = vi.fn();
    render(<CleanApp onSaved={saved} today={new Date(2026, 9, 18)} />);
    await user.click(screen.getByRole('button', { name: '가격 보기' }));
    await user.click(screen.getByRole('button', { name: '이 가격으로 예약하기' }));
    await user.click(screen.getByRole('button', { name: /10월 19일/ }));
    await user.click(screen.getByRole('button', { name: '오전 8시 시작' }));
    await user.click(screen.getByRole('button', { name: '다음' }));
    await user.click(screen.getByRole('button', { name: /초록손 청소/ }));
    await user.click(screen.getByRole('button', { name: '이 업체로 할게요' }));
    await user.type(screen.getByLabelText('주소 (구·동까지)'), '마포구 공덕동');
    await user.type(screen.getByLabelText('상세 주소'), '101호');
    await user.type(screen.getByLabelText('연락처'), '010-0000-0000');
    await user.type(screen.getByLabelText('메모'), '락스 빼 주세요');
    await user.click(screen.getByRole('button', { name: '다음' }));
    await user.click(screen.getByRole('button', { name: '예약하기 (체험)' }));
    await user.click(screen.getByRole('button', { name: '작업 날 미리 보기' }));
    await user.click(screen.getByRole('button', { name: '작업 시작 (업체가 누름)' }));
    await user.click(screen.getByRole('button', { name: '작업 끝 (업체가 누름)' }));
    await user.click(screen.getByRole('button', { name: '직접 확인하기' }));
    for (const group of screen.getAllByRole('group')) await user.click(within(group).getByRole('radio', { name: '아니요' }));
    await user.click(screen.getByRole('button', { name: '검수 완료' }));
    expect(saved).toHaveBeenCalledOnce();
    const record = saved.mock.calls[0][0] as CleanRecord;
    expect(record).toMatchObject({ area: '마포구 공덕동', viaZipsin: true, priceWon: 325000 });
    expect(JSON.stringify(record)).not.toContain('락스');
    expect(JSON.stringify(record)).not.toContain('101호');
  });

  it('TEST-CL-MY-004 shows the partner work log with consent badges and photo upload', async () => {
    const user = userEvent.setup();
    render(<PartnerApp today={new Date(2026, 9, 18)} />);
    await user.click(screen.getByRole('button', { name: '초대 수락하고 시작하기 (체험)' }));
    await user.click(screen.getByRole('tab', { name: '내 작업 기록' }));
    expect(screen.getByRole('heading', { level: 1, name: '내 작업 기록' })).toBeInTheDocument();
    const shared = screen.getByRole('article', { name: '2026년 9월 마포구 도화동' });
    expect(shared).toHaveTextContent('손님 동의 · 다른 손님에게 보임');
    const privateWork = screen.getByRole('article', { name: '2026년 8월 은평구 응암동' });
    expect(privateWork).toHaveTextContent('손님 동의 전 · 나만 보임');
    await user.upload(within(privateWork).getByLabelText('사진 올리기'), photo());
    expect(within(privateWork).getByRole('img', { name: '거실.jpg' })).toBeInTheDocument();
    expect(screen.getByText(/구·동까지만 남아요/)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: '작업 요청' }));
    await user.click(screen.getByRole('button', { name: /마포구 공덕동/ }));
    await user.click(screen.getByRole('button', { name: '이 가격으로 수락하기' }));
    await user.click(screen.getByRole('button', { name: '작업 시작' }));
    await user.click(screen.getByRole('button', { name: '작업 끝 · 완료 사진 올리기 (체험)' }));
    await user.click(screen.getByRole('button', { name: '손님 검수 완료 보기 (체험)' }));
    await user.click(screen.getByRole('button', { name: '요청 목록으로' }));
    await user.click(screen.getByRole('tab', { name: '내 작업 기록' }));
    expect(screen.getByText('집신 완료').nextSibling).toHaveTextContent('129건');
    expect(screen.getByRole('article', { name: /10월 19일.*마포구 공덕동/ })).toBeInTheDocument();
  });

  it('TEST-CL-MY-005 is the preparing screen on the live site and the my page on Preview', () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    const { unmount } = render(<CleanMyPageRoute />);
    expect(screen.getByRole('heading', { level: 1, name: '집신클린 서비스 준비 중이에요' })).toBeInTheDocument();
    unmount();
    vi.stubEnv('VERCEL_ENV', 'preview');
    render(<CleanMyPageRoute />);
    expect(screen.getByRole('heading', { level: 1, name: '마이페이지' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '업체 화면' })).toHaveAttribute('href', '/cl/partner');
  });
});
