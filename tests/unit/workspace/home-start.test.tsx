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

  it('TEST-ZH-HOME-006 gives an assistant a safe invitation next action without creating access', () => {
    render(<HomeStart primaryRole="assistant" offices={[]} />);

    expect(screen.queryByRole('button', { name: '사무소 만들기' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '사무소 초대 링크를 확인해 주세요' })).toBeInTheDocument();
    expect(screen.getByText(/역할을 선택한 것만으로 사무소나 집 기록이 열리지는 않습니다/)).toBeInTheDocument();
    expect(screen.queryByText(/서울|1203|등록된 집/)).not.toBeInTheDocument();
  });

  it('TEST-ZH-HOME-001 v2 같은 홈: 한 집 임차인도 내 집 목록과 금색 지금 할 일 하나를 본다', () => {
    render(<HomeStart
      primaryRole="tenant"
      offices={[]}
      spaceKind="me"
      recentHomes={[{
        id: 'home-1',
        label: '성수동 집',
        address: '서울 성동구 · 상세 주소 보호됨',
        relation: '사는 집',
        contractDay: { label: 'D-112', days: 112 },
        openTask: { id: 'task-1', title: '입주 사진 확인', dueAt: '2026-10-15T09:00:00+09:00' },
      }]}
      nextTask={{ id: 'task-1', homeId: 'home-1', title: '입주 사진 확인', dueAt: null }}
    />);

    expect(screen.getByRole('heading', { name: /내 집\s*1채/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /사진 없음\s*성수동 집/ })).toHaveAttribute('href', '/homes/home-1');
    expect(screen.getByText('사는 집 · 서울 성동구 · 상세 주소 보호됨')).toBeInTheDocument();
    expect(screen.getByText('만기 D-112')).toBeInTheDocument();
    expect(screen.getAllByText('지금 할 일')).toHaveLength(1);
    expect(screen.getByRole('link', { name: /지금 할 일/ })).toHaveAttribute('href', '/homes/home-1');
    expect(screen.getByRole('link', { name: /집신 파트너 등록/ })).toHaveAttribute('href', '/partners/new');
  });

  it('TEST-ZH-HOME-002 사무소 공간: 사무소 집 목록 · 집 등록 · 새 대화', () => {
    render(<HomeStart
      primaryRole="principal_broker"
      spaceKind="office"
      offices={[{ id: 'office-1', name: '집신 공인중개사무소', canRegisterHome: true }]}
      recentHomes={[
        { id: 'home-1', label: '집신아파트 1401호', address: '서울 노원구', contractDay: { label: 'D-21', days: 21 }, openTask: null },
        { id: 'home-2', label: '성수동 집', address: '서울 성동구', contractDay: null, openTask: { id: 'task-2', title: '계약서 확인', dueAt: null } },
      ]}
      unreadChatCount={3}
    />);

    expect(screen.getByRole('heading', { name: /사무소 집\s*2채/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /집신아파트 1401호/ })).toHaveAttribute('href', '/homes/home-1');
    expect(screen.getByRole('link', { name: /성수동 집/ })).toHaveAttribute('href', '/homes/home-2');
    expect(screen.getByText('만기 D-21')).toBeInTheDocument();
    expect(screen.getByText('계약서 확인')).toBeInTheDocument();
    expect(screen.getAllByText('사진 없음')).toHaveLength(2);
    expect(screen.getByRole('link', { name: /읽지 않은 메시지 3개/ })).toHaveAttribute('href', '/chats');
    expect(screen.getByRole('link', { name: '집 등록하기' })).toHaveAttribute('href', '/homes/new?office=office-1');
    expect(screen.queryByRole('link', { name: /집신 파트너 등록/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/체험|데모|가상|담당/)).not.toBeInTheDocument();
  });

  it('TEST-ZH-HOME-002b 개인 공간에 직접 연결된 집이 없으면 사무소로 바꾸는 길만 보여 준다', () => {
    render(<HomeStart primaryRole="associate_broker" spaceKind="me" offices={[{ id: 'office-1', name: '공릉공인중개사사무소', canRegisterHome: false }]} recentHomes={[]} />);
    expect(screen.getByRole('heading', { name: '직접 연결된 집이 아직 없어요' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '공릉공인중개사사무소로 바꾸기' })).toHaveAttribute('href', '/space?to=office-1');
  });

  it('TEST-ZH-HOME-002c 실제 사진이 있으면 그 사진을 썸네일로 쓴다', () => {
    render(<HomeStart primaryRole="tenant" spaceKind="me" offices={[]} recentHomes={[{ id: 'home-1', label: '102호', address: '공릉동', photoUrl: 'https://example.test/signed.jpg' }]} />);
    expect(screen.getByRole('img', { name: '102호 최근 사진' })).toHaveAttribute('src', 'https://example.test/signed.jpg');
  });

  it.each([
    ['landlord', '집 초대 링크를 확인해 주세요'],
    ['tenant', '집 초대 링크를 확인해 주세요'],
  ] as const)('TEST-ZH-HOME-003 guides %s without a visible home to a relationship invitation', (primaryRole, heading) => {
    render(<HomeStart primaryRole={primaryRole} offices={[]} recentHomes={[]} />);

    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
    expect(screen.getByText(/주소를 검색해 다른 사람의 기록에 연결할 수 없습니다/)).toBeInTheDocument();
    // DEC-038: 집이 없어도 같은 홈 맨 아래에서 파트너 등록으로 갈 수 있다.
    expect(screen.getByRole('link', { name: /집신 파트너 등록/ })).toHaveAttribute('href', '/partners/new');
  });

  it('TEST-ZH-HOME-004 uses confirmed empty copy instead of invented counts', () => {
    render(<HomeStart primaryRole="landlord" offices={[]} recentHomes={[]} unreadChatCount={0} nextTask={null} />);

    expect(screen.getByText('아직 연결된 집이 없습니다')).toBeInTheDocument();
    // 2026-10-18 Preview 검수: 홀로 떠 있던 '새 메시지가 없습니다' 줄은 새 대화가 있을 때만 보인다.
    expect(screen.queryByText('새 메시지가 없습니다')).not.toBeInTheDocument();
    expect(screen.queryByText(/0건|0개/)).not.toBeInTheDocument();
  });

  it('TEST-ZH-HOME-004b 집이 없어도 새 대화가 있으면 대화로 가는 길을 보여 준다', () => {
    render(<HomeStart primaryRole="tenant" offices={[]} recentHomes={[]} unreadChatCount={2} nextTask={null} />);
    expect(screen.getByRole('link', { name: '새 대화 2개 보기' })).toHaveAttribute('href', '/chats');
  });

  it('TEST-ZH-HOME-008 shows the created-office next step (first home 2/2, invite staff)', () => {
    render(<HomeStart primaryRole="principal_broker" offices={[{ id: 'office-1', name: '공릉공인중개사사무소', canRegisterHome: true }]} recentHomes={[]} justCreatedOffice />);
    expect(screen.getByRole('heading', { name: '사무소를 만들었어요' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '첫 집 등록하기 (2/2)' })).toHaveAttribute('href', '/homes/new?office=office-1');
    expect(screen.getByRole('link', { name: '직원 먼저 초대하기' })).toHaveAttribute('href', '/office/members');
  });

  it('TEST-ZH-HOME-009 uses real counts and gold only for the one current task', () => {
    render(<HomeStart
      primaryRole="principal_broker"
      offices={[{ id: 'office-1', name: '공릉공인중개사사무소', canRegisterHome: true }]}
      recentHomes={[{ id: 'home-1', label: '201호', address: '공릉동', contractDay: { label: 'D-40', days: 40 }, openTask: { id: 't1', title: '누수 확인', dueAt: null } }]}
      counts={{ totalHomes: 12, expiringSoon: 3, openTasks: 2 }}
      nextTask={{ id: 't1', homeId: 'home-1', title: '누수 확인', dueAt: null }}
    />);
    expect(screen.getByRole('link', { name: /사무소 집\s*12채/ })).toHaveAttribute('href', '/homes?office=office-1');
    expect(screen.getByRole('link', { name: /90일 내 만기\s*3채/ })).toHaveAttribute('href', '/homes?office=office-1&filter=expiring');
    expect(screen.getAllByText('지금 할 일')).toHaveLength(1);
    expect(screen.getByRole('link', { name: '전체 보기' })).toHaveAttribute('href', '/homes?office=office-1');
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

  it('TEST-ZH-HOME-MEDIA-001 실제 집 카드에 공개 교육 이미지를 사용하지 않는다', () => {
    const { container } = render(<HomeStart
      primaryRole="tenant"
      offices={[]}
      recentHomes={[{ id: 'home-1', label: '성수동 집', address: '상세 주소 보호됨', contractDay: null, openTask: null }]}
    />);

    expect(container.querySelector('img[src*="public-home"]')).not.toBeInTheDocument();
    expect(screen.getByText('사진 없음')).toBeInTheDocument();
  });

  it('TEST-ZH-HOME-MEDIA-002 여러 집 카드도 실제 사진 연결 전에는 중립 상태만 표시한다', () => {
    const { container } = render(<HomeStart
      primaryRole="principal_broker"
      offices={[{ id: 'office-1', name: '집신 공인중개사무소' }]}
      recentHomes={[
        { id: 'home-1', label: '첫 번째 집', address: '상세 주소 보호됨', contractDay: null, openTask: null },
        { id: 'home-2', label: '두 번째 집', address: '상세 주소 보호됨', contractDay: null, openTask: null },
      ]}
    />);

    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(screen.getAllByText('사진 없음')).toHaveLength(2);
  });
});
