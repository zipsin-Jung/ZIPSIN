import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HomeStart } from '@/features/workspace/components/HomeStart';

describe('HomeStart', () => {
  it('TEST-RC-HOME-001 shows an office creation path to a principal broker without an office', () => {
    render(<HomeStart primaryRole="principal_broker" offices={[]} />);

    expect(screen.getByRole('heading', { name: '집의 모든 기록과 대화를한곳에서 이어가세요' })).toBeInTheDocument();
    expect(screen.getByText('집을 등록하고')).toBeInTheDocument();
    expect(screen.getByText('기록을 남기고')).toBeInTheDocument();
    expect(screen.getByText('함께 이야기합니다')).toBeInTheDocument();
    expect(screen.getByLabelText('사무소 이름')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '사무소 만들기' })).toBeInTheDocument();
  });

  it('TEST-RC-HOME-003 gives an assistant a safe invitation next action without creating access', () => {
    render(<HomeStart primaryRole="assistant" offices={[]} />);

    expect(screen.queryByRole('button', { name: '사무소 만들기' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '사무소 초대 링크를 확인해 주세요' })).toBeInTheDocument();
    expect(screen.getByText(/역할을 선택한 것만으로 사무소나 집 기록이 열리지는 않습니다/)).toBeInTheDocument();
    expect(screen.getByText(/받은 초대 링크를 열어 수락/)).toBeInTheDocument();
    expect(screen.queryByText(/서울|1203|등록된 집/)).not.toBeInTheDocument();
  });

  it('TEST-RC-HOME-002 links an active office member to recent real work', () => {
    render(<HomeStart
      primaryRole="principal_broker"
      offices={[{ id: 'office-1', name: '집신 공인중개사무소' }]}
      recentHomes={[{ id: 'home-1', label: '성수동 집', address: '서울 성동구' }]}
      unreadChatCount={3}
      nextTask={{ id: 'task-1', homeId: 'home-1', title: '입주 사진 확인', dueAt: '2026-10-15T09:00:00+09:00' }}
    />);

    expect(screen.getByText('집신 공인중개사무소')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '집의 모든 기록과 대화를한곳에서 이어가세요' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '집 등록하기' })).toHaveAttribute('href', '/homes/new?office=office-1');
    expect(screen.getByRole('link', { name: '집 목록 보기 →' })).toHaveAttribute('href', '/homes?office=office-1');
    expect(screen.getByRole('link', { name: '구성원 관리 →' })).toHaveAttribute('href', '/office/members');
    expect(screen.getByRole('link', { name: /성수동 집/ })).toHaveAttribute('href', '/homes/home-1');
    expect(screen.getByRole('link', { name: /읽지 않은 메시지 3개/ })).toHaveAttribute('href', '/chats');
    expect(screen.getByRole('link', { name: /입주 사진 확인/ })).toHaveAttribute('href', '/homes/home-1');
    expect(screen.queryByText(/담당/)).not.toBeInTheDocument();
    expect(screen.queryByText(/체험|데모|가상/)).not.toBeInTheDocument();
  });

  it.each([
    ['landlord', '집 초대 링크를 확인해 주세요'],
    ['tenant', '집 초대 링크를 확인해 주세요'],
  ] as const)('TEST-RC-HOME-003 guides %s to a relationship invitation', (primaryRole, heading) => {
    render(<HomeStart primaryRole={primaryRole} offices={[]} />);

    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
    expect(screen.getByText(/주소를 검색해 다른 사람의 기록에 연결할 수 없습니다/)).toBeInTheDocument();
  });

  it('shows only confirmed empty states when no real activity exists', () => {
    render(<HomeStart primaryRole="landlord" offices={[]} recentHomes={[]} unreadChatCount={0} nextTask={null} />);

    expect(screen.getByText('아직 연결된 집이 없습니다')).toBeInTheDocument();
    expect(screen.getByText('새 메시지가 없습니다')).toBeInTheDocument();
    expect(screen.queryByText(/0건|0개/)).not.toBeInTheDocument();
  });
});
