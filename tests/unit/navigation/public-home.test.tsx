import { fireEvent, render, screen } from '@testing-library/react';
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

  it('TEST-RC-PUB-IMG-001 실제 생활의 네 장면을 이미지와 함께 선택할 수 있다', () => {
    render(<PublicHome />);

    expect(screen.getAllByRole('tab')).toHaveLength(4);
    expect(screen.getByRole('tab', { name: /집 사진이 흩어졌을 때/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /에어컨이 고장 났을 때/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /도배·장판 상태/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /급하게 계약서/ })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /컴퓨터와 휴대전화에 흩어진 집 사진/ })).toBeInTheDocument();
    expect(screen.getAllByText('생활 장면 예시')).toHaveLength(2);
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

  it('TEST-RC-PUB-IMG-002 사례를 바꾸면 생활 이미지와 해당 집신 화면이 함께 바뀐다', async () => {
    const user = userEvent.setup();
    render(<PublicHome />);

    const scattered = screen.getByRole('tab', { name: /집 사진이 흩어졌을 때/ });
    const contract = screen.getByRole('tab', { name: /급하게 계약서/ });

    expect(scattered).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('집 사진 기록');

    await user.click(contract);

    expect(contract).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('img', { name: /외부에서 계약서를 찾는 순간/ })).toBeInTheDocument();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('계약 만기일');
  });

  it('TEST-RC-PUB-005 네 사례를 좌우 키로 순환하며 해당 증거 화면을 보여준다', async () => {
    const user = userEvent.setup();
    render(<PublicHome />);
    const expected = ['계약 만기일', '에어컨 설치·수리 기록', '거실 바닥 상태 비교'];
    let selected = screen.getByRole('tab', { name: /집 사진이 흩어졌을 때/ });
    selected.focus();
    for (const text of expected) {
      await user.keyboard('{ArrowRight}');
      selected = screen.getByRole('tab', { selected: true });
      expect(selected).toHaveFocus();
      expect(screen.getByRole('tabpanel')).toHaveTextContent(text);
    }
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('집 사진 기록');
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('거실 바닥 상태 비교');
  });

  it('TEST-RC-PUB-IMG-003 이미지가 실패해도 설명과 제품 화면을 유지한다', () => {
    render(<PublicHome />);

    fireEvent.error(screen.getByRole('img', { name: /컴퓨터와 휴대전화에 흩어진 집 사진/ }));

    expect(screen.getByText('이미지를 불러오지 못했습니다.')).toBeInTheDocument();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('집 사진 기록');
    expect(screen.getAllByRole('link', { name: '웹에서 시작하기' })[0]).toBeInTheDocument();
  });

  it('TEST-RC-PUB-EV-001 예시 데이터와 실제 기능 화면을 구분한다', () => {
    render(<PublicHome />);

    expect(screen.getAllByText('제품 화면 예시')).toHaveLength(2);
    expect(screen.getByText(/직원이 바뀌어도 기록이 이어집니다/)).toBeInTheDocument();
    expect(screen.getByText(/입주부터 퇴거까지 같은 집에서 확인합니다/)).toBeInTheDocument();
  });

  it('TEST-RC-PUB-EV-002 공개 예시 화면은 동작하지 않는 가짜 버튼을 만들지 않는다', async () => {
    const user = userEvent.setup();
    render(<PublicHome />);

    await user.click(screen.getByRole('tab', { name: /급하게 계약서/ }));

    expect(screen.queryByRole('button', { name: '계약 문서 확인' })).not.toBeInTheDocument();
    expect(screen.getByText('계약 문서 확인')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '이 집 기록 시작하기' })).toHaveAttribute('href', '/signup');
  });
});
