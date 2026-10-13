import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HomeStart } from '@/features/workspace/components/HomeStart';

describe('HomeStart', () => {
  it('TEST-ZH-HOME-005 gives a principal broker without an office one real starting action', () => {
    render(<HomeStart primaryRole="principal_broker" offices={[]} />);

    expect(screen.queryByText('집의 모든 기록과 대화를')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '사무소 공간을 먼저 만드세요' })).toBeInTheDocument();
    expect(screen.getByLabelText('사무소 이름')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '사무소 만들기' })).toBeInTheDocument();
  });

  it('TEST-ZH-HOME-006 gives an assistant a safe invitation next action without creating access', () => {
    render(<HomeStart primaryRole="assistant" offices={[]} />);

    expect(screen.queryByRole('button', { name: '사무소 만들기' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '사무소 초대 링크를 확인해 주세요' })).toBeInTheDocument();
    expect(screen.getByText(/역할을 선택한 것만으로 사무소나 집 기록이 열리지는 않습니다/)).toBeInTheDocument();
    expect(screen.queryByText(/서울|1203|등록된 집/)).not.toBeInTheDocument();
  });

  it('TEST-ZH-HOME-001 sends a one-home user straight to the real home and next work', () => {
    render(<HomeStart
      primaryRole="tenant"
      offices={[]}
      recentHomes={[{
        id: 'home-1',
        label: '성수동 집',
        address: '서울 성동구 · 상세 주소 보호됨',
        contractDay: { label: 'D-112', days: 112 },
        openTask: { id: 'task-1', title: '입주 사진 확인', dueAt: '2026-10-15T09:00:00+09:00' },
      }]}
    />);

    expect(screen.getByRole('heading', { name: '성수동 집' })).toBeInTheDocument();
    expect(screen.getByText('D-112')).toBeInTheDocument();
    expect(screen.getByText('입주 사진 확인')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '성수동 집 열기' })).toHaveAttribute('href', '/homes/home-1');
    expect(screen.queryByText('첫 집부터 기록을 시작하세요')).not.toBeInTheDocument();
  });

  it('TEST-ZH-HOME-002 prioritizes expiry and open work for a multi-home office', () => {
    render(<HomeStart
      primaryRole="principal_broker"
      offices={[{ id: 'office-1', name: '집신 공인중개사무소', canRegisterHome: true }]}
      recentHomes={[
        { id: 'home-1', label: '집신아파트 1401호', address: '서울 노원구', contractDay: { label: 'D-21', days: 21 }, openTask: null },
        { id: 'home-2', label: '성수동 집', address: '서울 성동구', contractDay: null, openTask: { id: 'task-2', title: '계약서 확인', dueAt: null } },
      ]}
      unreadChatCount={3}
    />);

    expect(screen.getByRole('heading', { name: '오늘 확인할 집' })).toBeInTheDocument();
    expect(screen.getByText('집신 공인중개사무소')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /집신아파트 1401호/ })).toHaveAttribute('href', '/homes/home-1');
    expect(screen.getByRole('link', { name: /성수동 집/ })).toHaveAttribute('href', '/homes/home-2');
    expect(screen.getByText('D-21')).toBeInTheDocument();
    expect(screen.getByText('계약서 확인')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /읽지 않은 메시지 3개/ })).toHaveAttribute('href', '/chats');
    expect(screen.getByRole('link', { name: '집 등록하기' })).toHaveAttribute('href', '/homes/new?office=office-1');
    expect(screen.queryByText(/체험|데모|가상|담당/)).not.toBeInTheDocument();
  });

  it.each([
    ['landlord', '집 초대 링크를 확인해 주세요'],
    ['tenant', '집 초대 링크를 확인해 주세요'],
  ] as const)('TEST-ZH-HOME-003 guides %s without a visible home to a relationship invitation', (primaryRole, heading) => {
    render(<HomeStart primaryRole={primaryRole} offices={[]} recentHomes={[]} />);

    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
    expect(screen.getByText(/주소를 검색해 다른 사람의 기록에 연결할 수 없습니다/)).toBeInTheDocument();
  });

  it('TEST-ZH-HOME-004 uses confirmed empty copy instead of invented counts', () => {
    render(<HomeStart primaryRole="landlord" offices={[]} recentHomes={[]} unreadChatCount={0} nextTask={null} />);

    expect(screen.getByText('아직 연결된 집이 없습니다')).toBeInTheDocument();
    expect(screen.getByText('새 메시지가 없습니다')).toBeInTheDocument();
    expect(screen.queryByText(/0건|0개/)).not.toBeInTheDocument();
  });
});
