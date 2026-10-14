import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeStoryCarousel } from '@/features/public-home/components/HomeStoryCarousel';

function installMatchMedia(matches = false) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function setVisibility(value: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value });
  document.dispatchEvent(new Event('visibilitychange'));
}

let intersectionCallback: IntersectionObserverCallback | null = null;
let intersectionTarget: Element | null = null;

function installIntersectionObserver() {
  class MockIntersectionObserver {
    constructor(callback: IntersectionObserverCallback) {
      intersectionCallback = callback;
    }

    observe(target: Element) {
      intersectionTarget = target;
      setCarouselInView(true);
    }

    disconnect() {}
    unobserve() {}
    takeRecords() { return []; }
    root = null;
    rootMargin = '0px';
    thresholds = [0, 0.25];
  }

  Object.defineProperty(globalThis, 'IntersectionObserver', {
    configurable: true,
    value: MockIntersectionObserver,
  });
}

function setCarouselInView(isIntersecting: boolean) {
  if (!intersectionCallback || !intersectionTarget) return;
  intersectionCallback([{
    target: intersectionTarget,
    isIntersecting,
    intersectionRatio: isIntersecting ? 1 : 0,
  } as IntersectionObserverEntry], {} as IntersectionObserver);
}

describe('HomeStoryCarousel', () => {
  beforeEach(() => {
    installMatchMedia(false);
    installIntersectionObserver();
    setVisibility('visible');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('TEST-PUB-SV-TRACK-001 네 장을 하나의 가로 트랙에 두고 활성 장만 접근성 트리에 노출한다', () => {
    render(<HomeStoryCarousel />);

    expect(screen.getByRole('region', { name: '집신이 필요한 네 장면' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /계약과 동시에 흩어지는 부동산 정보.*하나의 집 이력으로 가치를 키웁니다/ })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '사람은 바뀌어도, 집의 기록은 이어집니다.' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('group', { hidden: true })).toHaveLength(4);
    expect(screen.getByTestId('home-story-track')).toHaveStyle({ transform: 'translate3d(0%, 0, 0)' });
    expect(screen.getByText('1 / 4')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '이전 장면' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '다음 장면' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '자동 넘김 일시정지' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /장면 보기/ })).toHaveLength(4);
    expect(screen.getByRole('link', { name: /내 집 기록 시작하기/ })).toHaveAttribute('href', '/signup');
  });

  it('TEST-PUB-SV-TRACK-002 다음 장 선택 시 트랙을 정확히 한 화면 왼쪽으로 이동한다', () => {
    render(<HomeStoryCarousel />);

    fireEvent.click(screen.getByRole('button', { name: '다음 장면' }));

    expect(screen.getByTestId('home-story-track')).toHaveStyle({ transform: 'translate3d(-100%, 0, 0)' });
    expect(screen.getByRole('heading', { name: '사람은 바뀌어도, 집의 기록은 이어집니다.' })).toBeInTheDocument();
  });

  it('TEST-RC-HERO-MANUAL-001 화살표와 Home·End 키가 경계 안에서 이동하고 포커스를 빼앗지 않는다', () => {
    render(<HomeStoryCarousel />);
    const firstDot = screen.getByRole('button', { name: '모인다 장면 보기' });
    firstDot.focus();

    fireEvent.keyDown(firstDot, { key: 'ArrowRight' });
    expect(screen.getByRole('heading', { name: '사람은 바뀌어도, 집의 기록은 이어집니다.' })).toBeInTheDocument();
    expect(firstDot).toHaveFocus();

    fireEvent.keyDown(firstDot, { key: 'End' });
    expect(screen.getByRole('heading', { name: '위치와 서류만 보고 계신가요?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음 장면' })).toBeDisabled();

    fireEvent.keyDown(firstDot, { key: 'Home' });
    expect(screen.getByText('1 / 4')).toBeInTheDocument();
    fireEvent.keyDown(firstDot, { key: 'ArrowLeft' });
    expect(screen.getByText('1 / 4')).toBeInTheDocument();
  });

  it('TEST-RC-HERO-FOCUS-002 CTA의 방향키는 장면을 바꾸거나 포커스를 잃게 하지 않는다', () => {
    render(<HomeStoryCarousel />);
    const cta = screen.getByRole('link', { name: /내 집 기록 시작하기/ });
    cta.focus();

    fireEvent.keyDown(cta, { key: 'ArrowRight' });

    expect(screen.getByText('1 / 4')).toBeInTheDocument();
    expect(cta).toHaveFocus();
  });

  it('TEST-RC-HERO-AUTO-001 7초마다 한 장씩 이동하고 마지막 장에서 멈춘다', () => {
    vi.useFakeTimers();
    render(<HomeStoryCarousel />);

    for (const page of ['2 / 4', '3 / 4', '4 / 4']) {
      act(() => vi.advanceTimersByTime(7000));
      expect(screen.getByText(page)).toBeInTheDocument();
    }
    act(() => vi.advanceTimersByTime(14000));
    expect(screen.getByText('4 / 4')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '자동 넘김 재생' })).toBeInTheDocument();
  });

  it('TEST-RC-HERO-HOVER-001 점 hover 250ms 뒤 선택하고 이탈 시 예약을 취소한다', () => {
    vi.useFakeTimers();
    render(<HomeStoryCarousel />);
    const thirdDot = screen.getByRole('button', { name: '연결된다 장면 보기' });

    fireEvent.pointerEnter(thirdDot);
    act(() => vi.advanceTimersByTime(249));
    expect(screen.getByText('1 / 4')).toBeInTheDocument();
    fireEvent.pointerLeave(thirdDot);
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByText('1 / 4')).toBeInTheDocument();

    fireEvent.pointerEnter(thirdDot);
    act(() => vi.advanceTimersByTime(250));
    expect(screen.getByText('3 / 4')).toBeInTheDocument();
  });

  it('TEST-RC-HERO-HOVER-002 carousel hover가 자동재생을 멈추고 이탈 1.5초 뒤 새 주기로 재개한다', () => {
    vi.useFakeTimers();
    render(<HomeStoryCarousel />);
    const region = screen.getByRole('region', { name: '집신이 필요한 네 장면' });

    fireEvent.mouseEnter(region);
    act(() => vi.advanceTimersByTime(8000));
    expect(screen.getByText('1 / 4')).toBeInTheDocument();
    fireEvent.mouseLeave(region);
    act(() => vi.advanceTimersByTime(1499));
    expect(screen.getByText('1 / 4')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    act(() => vi.advanceTimersByTime(6999));
    expect(screen.getByText('1 / 4')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByText('2 / 4')).toBeInTheDocument();
  });

  it('TEST-RC-HERO-FOCUS-001 focus-within 동안 멈추고 focus 이탈 1.5초 뒤 재개한다', () => {
    vi.useFakeTimers();
    render(<HomeStoryCarousel />);
    const next = screen.getByRole('button', { name: '다음 장면' });

    fireEvent.focus(next);
    act(() => vi.advanceTimersByTime(8000));
    expect(screen.getByText('1 / 4')).toBeInTheDocument();
    fireEvent.blur(next, { relatedTarget: document.body });
    act(() => vi.advanceTimersByTime(1500));
    act(() => vi.advanceTimersByTime(7000));
    expect(screen.getByText('2 / 4')).toBeInTheDocument();
  });

  it('TEST-RC-HERO-MANUAL-002 명시적 조작 뒤에는 재생 버튼을 누르기 전까지 자동재생하지 않는다', () => {
    vi.useFakeTimers();
    render(<HomeStoryCarousel />);

    fireEvent.click(screen.getByRole('button', { name: '다음 장면' }));
    expect(screen.getByText('2 / 4')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(30000));
    expect(screen.getByText('2 / 4')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '자동 넘김 재생' }));
    act(() => vi.advanceTimersByTime(7000));
    expect(screen.getByText('3 / 4')).toBeInTheDocument();
  });

  it('TEST-RC-HERO-VISIBILITY-001 숨김 탭에서는 멈추고 복귀하면 새 7초 주기로 재개한다', () => {
    vi.useFakeTimers();
    render(<HomeStoryCarousel />);

    act(() => vi.advanceTimersByTime(3000));
    act(() => setVisibility('hidden'));
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.getByText('1 / 4')).toBeInTheDocument();
    act(() => setVisibility('visible'));
    act(() => vi.advanceTimersByTime(6999));
    expect(screen.getByText('1 / 4')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByText('2 / 4')).toBeInTheDocument();
  });

  it('TEST-RC-HERO-VIEWPORT-001 화면 밖에서는 멈추고 다시 보이면 새 7초 주기로 재개한다', () => {
    vi.useFakeTimers();
    render(<HomeStoryCarousel />);

    act(() => setCarouselInView(false));
    act(() => vi.advanceTimersByTime(14000));
    expect(screen.getByText('1 / 4')).toBeInTheDocument();

    act(() => setCarouselInView(true));
    act(() => vi.advanceTimersByTime(6999));
    expect(screen.getByText('1 / 4')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByText('2 / 4')).toBeInTheDocument();
  });

  it('TEST-RC-HERO-MOTION-001 모션 감소 설정에서는 자동재생하지 않고 수동 전환만 허용한다', () => {
    installMatchMedia(true);
    vi.useFakeTimers();
    render(<HomeStoryCarousel />);

    act(() => vi.advanceTimersByTime(14000));
    expect(screen.getByText('1 / 4')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '자동 넘김 재생' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '다음 장면' }));
    expect(screen.getByText('2 / 4')).toBeInTheDocument();
  });

  it('TEST-RC-HERO-SWIPE-001 수평 48px 이상 제스처만 수동 장면 이동으로 처리한다', () => {
    render(<HomeStoryCarousel />);
    const stage = screen.getByTestId('home-story-stage');

    fireEvent.pointerDown(stage, { clientX: 200, clientY: 100, pointerId: 1 });
    fireEvent.pointerUp(stage, { clientX: 170, clientY: 104, pointerId: 1 });
    expect(screen.getByText('1 / 4')).toBeInTheDocument();

    fireEvent.pointerDown(stage, { clientX: 200, clientY: 100, pointerId: 2 });
    fireEvent.pointerUp(stage, { clientX: 145, clientY: 110, pointerId: 2 });
    expect(screen.getByText('2 / 4')).toBeInTheDocument();

    fireEvent.pointerDown(stage, { clientX: 145, clientY: 100, pointerId: 3 });
    fireEvent.pointerUp(stage, { clientX: 200, clientY: 180, pointerId: 3 });
    expect(screen.getByText('2 / 4')).toBeInTheDocument();
  });

  it('TEST-RC-HERO-POINTER-001 누르고 있는 동안 자동재생을 멈춘다', () => {
    vi.useFakeTimers();
    render(<HomeStoryCarousel />);
    const stage = screen.getByTestId('home-story-stage');

    fireEvent.pointerDown(stage, { clientX: 200, clientY: 100, pointerId: 1 });
    act(() => vi.advanceTimersByTime(8000));
    expect(screen.getByText('1 / 4')).toBeInTheDocument();

    fireEvent.pointerUp(stage, { clientX: 200, clientY: 100, pointerId: 1 });
    act(() => vi.advanceTimersByTime(1500));
    act(() => vi.advanceTimersByTime(7000));
    expect(screen.getByText('2 / 4')).toBeInTheDocument();
  });

  it('TEST-RC-HERO-POINTER-002 무대 밖에서 놓아도 누름 상태를 해제한다', () => {
    vi.useFakeTimers();
    render(<HomeStoryCarousel />);
    const stage = screen.getByTestId('home-story-stage');

    fireEvent.pointerDown(stage, { clientX: 200, clientY: 100, pointerId: 1 });
    fireEvent.pointerUp(window, { clientX: 1, clientY: 100, pointerId: 1 });
    act(() => vi.advanceTimersByTime(1500));
    act(() => vi.advanceTimersByTime(7000));

    expect(screen.getByText('2 / 4')).toBeInTheDocument();
  });

  it('TEST-RC-HERO-ERROR-001 이미지 실패 뒤에도 설명과 가입 CTA를 유지한다', () => {
    render(<HomeStoryCarousel />);

    fireEvent.error(screen.getByRole('img', { name: /흩어진 계약서와 사진/ }));

    expect(screen.getByText('이미지를 불러오지 못했습니다.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /계약과 동시에 흩어지는 부동산 정보/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /내 집 기록 시작하기/ })).toHaveAttribute('href', '/signup');
  });
});
