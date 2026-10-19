import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HomeStart } from '@/features/workspace/components/HomeStart';

describe('HomeStart', () => {
  it('TEST-ZH-HOME-005 gives a principal broker without an office one real starting action', () => {
    render(<HomeStart primaryRole="principal_broker" offices={[]} />);

    expect(screen.queryByText('집의 모든 기록과 대화를')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '두 단계만 하면 시작돼요' })).toBeInTheDocument();
    expect(screen.getByText('직원으로 들어오셨나요?')).toBeInTheDocument();
    expect(screen.getByLabelText('사무소 이름')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '사무소 만들기' })).toBeInTheDocument();
  });

  it('TEST-ZH-HOME-008 shows the created-office next step (first home 2/2, invite staff)', () => {
    render(<HomeStart primaryRole="principal_broker" offices={[{ id: 'office-1', name: '공릉공인중개사사무소', canRegisterHome: true }]} recentHomes={[]} justCreatedOffice />);
    expect(screen.getByRole('heading', { name: '사무소를 만들었어요' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '첫 집 등록하기 (2/2)' })).toHaveAttribute('href', '/homes/new?office=office-1');
    expect(screen.getByRole('link', { name: '직원 먼저 초대하기' })).toHaveAttribute('href', '/office/members');
  });

  it('TEST-ZH-HOME-010 shows the new-staff brief with office notes only right after joining', () => {
    const props = {
      primaryRole: 'assistant' as const,
      offices: [{ id: 'office-1', name: '공릉공인중개사사무소' }],
      recentHomes: [{ id: 'home-1', label: '201호', address: '공릉동', contractDay: null, openTask: null }],
      counts: { totalHomes: 12, expiringSoon: 3, openTasks: 2 },
    };
    const { rerender } = render(<HomeStart {...props} staffNotes={[{ id: 'n1', homeId: 'home-1', title: '201호 임대인은 오전에만 통화 가능' }]} />);
    expect(screen.getByRole('heading', { name: '5분이면 이 사무소 일을 이어받을 수 있어요' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '201호 임대인은 오전에만 통화 가능' })).toHaveAttribute('href', '/homes/home-1');
    rerender(<HomeStart {...props} />);
    expect(screen.queryByRole('heading', { name: '5분이면 이 사무소 일을 이어받을 수 있어요' })).not.toBeInTheDocument();
  });

  it('TEST-ZH-MYHOME-001 Figma My Home: 집이 없어도 같은 화면, 없는 기능은 준비 중, 계약은 초대 안내', () => {
    render(<HomeStart primaryRole="tenant" offices={[]} recentHomes={[]} />);
    expect(screen.getByRole('heading', { name: '집을 알아보고 있어요' })).toBeInTheDocument();
    expect(screen.getByText('집 찾기 시작하기').closest('[aria-disabled="true"]')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /집 찾기 시작하기/ })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '계약했어요' })).toBeInTheDocument();
    expect(screen.getByText(/초대 링크를 열면/)).toBeInTheDocument();
    expect(screen.getByText('등록된 집이 없어요.')).toBeInTheDocument();
    expect(screen.getByText('예정된 일정이 없어요.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /집 추가/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/AI/)).not.toBeInTheDocument();
  });

  it('TEST-ZH-MYHOME-002 대표 공인중개사 사무소 공간: 집 추가는 실제 등록 화면으로', () => {
    render(<HomeStart primaryRole="principal_broker" spaceKind="office" offices={[{ id: 'office-1', name: '공릉공인중개사사무소', canRegisterHome: true }]} recentHomes={[]} />);
    expect(screen.getByRole('link', { name: '집 추가' })).toHaveAttribute('href', '/homes/new?office=office-1');
    expect(screen.getByRole('link', { name: '집 추가하기' })).toHaveAttribute('href', '/homes/new?office=office-1');
    expect(screen.getByRole('link', { name: '계약 등록하기' })).toHaveAttribute('href', '/homes/new?office=office-1');
  });

  it('TEST-ZH-MYHOME-003 내 집 목록 · 실제 사진 · 금색 지금 할 일 하나 · 새 대화', () => {
    render(<HomeStart
      primaryRole="tenant"
      offices={[]}
      spaceKind="me"
      recentHomes={[{ id: 'home-1', label: '성수동 집', address: '서울 성동구', relation: '사는 집', contractDay: { label: 'D-112', days: 112 }, photoUrl: 'https://example.test/a.jpg', openTask: { id: 't1', title: '입주 사진 확인', dueAt: null } }]}
      nextTask={{ id: 't1', homeId: 'home-1', title: '입주 사진 확인', dueAt: null }}
      unreadChatCount={2}
    />);
    expect(screen.getByRole('link', { name: /성수동 집 최근 사진/ })).toHaveAttribute('href', '/homes/home-1');
    expect(screen.getByRole('img', { name: '성수동 집 최근 사진' })).toHaveAttribute('src', 'https://example.test/a.jpg');
    expect(screen.getByText('사는 집 · 서울 성동구')).toBeInTheDocument();
    expect(screen.getAllByText('지금 할 일')).toHaveLength(1);
    expect(screen.getByRole('link', { name: /새 대화 2개/ })).toHaveAttribute('href', '/chats');
    expect(screen.getByRole('link', { name: '계약 등록하기' })).toHaveAttribute('href', '/homes/home-1');
  });

  it('TEST-ZH-MYHOME-004 최근 기록 숫자와 이번 달 일정은 받은 실제 값만', () => {
    render(<HomeStart
      primaryRole="landlord"
      offices={[]}
      recentHomes={[{ id: 'h', label: '102호', address: '공릉동' }]}
      recordCounts={{ photo: 12, document: 1, receipt: 0, note: 3, repair: 2 }}
      events={[{ id: 'e', homeId: 'h', date: '2026-10-28T00:00:00+09:00', title: '계약 만기', homeLabel: '102호' }]}
    />);
    expect(screen.getByRole('link', { name: /사진\s*12장/ })).toHaveAttribute('href', '/records');
    expect(screen.getByRole('link', { name: /수리\s*2건/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /계약 만기/ })).toHaveAttribute('href', '/homes/h');
  });

  it('TEST-ZH-MYHOME-005 개인 공간에 집이 없고 사무소가 있으면 사무소로 바꾸는 길', () => {
    render(<HomeStart primaryRole="associate_broker" spaceKind="me" offices={[{ id: 'office-1', name: '공릉공인중개사사무소', canRegisterHome: false }]} recentHomes={[]} />);
    expect(screen.getByRole('link', { name: '공릉공인중개사사무소' })).toHaveAttribute('href', '/space?to=office-1');
  });
});
