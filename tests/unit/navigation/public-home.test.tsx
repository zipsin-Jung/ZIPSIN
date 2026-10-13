import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import PublicHome from '@/components/PublicHome';

describe('PublicHome', () => {
  it('TEST-RC-PUB-001 집신의 한 문장과 사용 범위를 첫 화면에서 설명한다', () => {
    render(<PublicHome />);

    expect(screen.getByRole('heading', { name: /집에 관한 일,\s*다시 묻고 다시 찾지 않도록\./ })).toBeInTheDocument();
    expect(screen.getByText('계약서, 사진, 대화, 일정과 집에서 있었던 일을 집 한 채에 이어서 기록하세요.')).toBeInTheDocument();
    expect(screen.queryByText(/사전.?가입|데모|출시 알림/)).not.toBeInTheDocument();
  });

  it('TEST-RC-PUB-002 실제 생활의 여섯 순간을 선택할 수 있다', () => {
    render(<PublicHome />);

    expect(screen.getAllByRole('tab')).toHaveLength(6);
    expect(screen.getByRole('tab', { name: /에어컨이 고장 났을 때/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /장기수선충당금/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /도배·장판 상태/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /급하게 계약서/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /직원이 바뀌어도/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /퇴거할 때/ })).toBeInTheDocument();
  });

  it('TEST-RC-PUB-003 실제 서비스 경로로만 연결한다', () => {
    render(<PublicHome />);

    expect(screen.getAllByRole('link', { name: '로그인' })[0]).toHaveAttribute('href', '/login');
    expect(screen.getAllByRole('link', { name: '웹에서 시작하기' })[0]).toHaveAttribute('href', '/signup');
    expect(screen.getAllByRole('link', { name: '고객지원' })[0]).toHaveAttribute('href', '/support');
    expect(screen.queryByRole('link', { name: /앱 다운로드|App Store|Google Play/ })).not.toBeInTheDocument();
  });

  it('TEST-SUPPORT-KAKAO-004 푸터에서 공식 카카오 채널을 안전하게 연다', () => {
    render(<PublicHome />);

    const channel = screen.getByRole('link', { name: '집신 카카오 채널 (새 창)' });
    expect(channel).toHaveAttribute('href', 'https://pf.kakao.com/_xhcxkFX');
    expect(channel).toHaveAttribute('target', '_blank');
    expect(channel).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(channel).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
  });

  it('TEST-RC-PUB-004 사례를 키보드로 바꾸면 해당 집신 화면이 나타난다', async () => {
    const user = userEvent.setup();
    render(<PublicHome />);

    const airConditioner = screen.getByRole('tab', { name: /에어컨이 고장 났을 때/ });
    const contract = screen.getByRole('tab', { name: /급하게 계약서/ });

    expect(airConditioner).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('에어컨 설치·수리 기록');

    await user.click(contract);

    expect(contract).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('계약 만기일');
  });

  it('TEST-RC-PUB-005 모든 사례를 좌우 키로 순환하며 해당 증거 화면을 보여준다', async () => {
    const user = userEvent.setup();
    render(<PublicHome />);
    const expected = ['장기수선충당금 관련 자료', '거실 바닥 상태 비교', '임대차계약', '이 집의 다음 일', '입주부터 퇴거까지'];
    let selected = screen.getByRole('tab', { name: /에어컨이 고장 났을 때/ });
    selected.focus();
    for (const text of expected) {
      await user.keyboard('{ArrowRight}');
      selected = screen.getByRole('tab', { selected: true });
      expect(selected).toHaveFocus();
      expect(screen.getByRole('tabpanel')).toHaveTextContent(text);
    }
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('에어컨 설치·수리 기록');
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('입주부터 퇴거까지');
  });
});
