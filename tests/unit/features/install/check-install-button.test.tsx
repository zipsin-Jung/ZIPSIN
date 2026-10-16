import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CheckInstallButton } from '@/features/install/components/CheckInstallButton';

vi.mock('qrcode', () => ({ default: { toString: vi.fn(async (text: string) => `<svg data-qr="${text}"></svg>`) } }));

type Choice = 'accepted' | 'dismissed';
function installEvent(choice: Choice) {
  const event = new Event('beforeinstallprompt') as Event & { prompt: ReturnType<typeof vi.fn>; userChoice: Promise<{ outcome: Choice; platform: string }> };
  event.prompt = vi.fn().mockResolvedValue(undefined);
  event.userChoice = Promise.resolve({ outcome: choice, platform: 'web' });
  return event;
}

function setDevice({ phone, standalone = false }: { phone: boolean; standalone?: boolean }) {
  Object.defineProperty(window.navigator, 'userAgent', {
    configurable: true,
    value: phone ? 'Mozilla/5.0 (Linux; Android 15; SM-S928N) SamsungBrowser/27.0' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/141',
  });
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('standalone') ? standalone : query.includes('coarse') ? phone : false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
}

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function showModal() { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function close() { this.removeAttribute('open'); this.dispatchEvent(new Event('close')); };
  window.history.replaceState({ zipsinCheckScreen: 'start' }, '', '/ck');
});
afterEach(() => vi.restoreAllMocks());

describe('TEST-CK-INSTALL-003 PC에서 앱 받기', () => {
  it('QR과 세 단계 안내를 보여주고, QR은 지금 주소의 설치 안내로 연결된다', async () => {
    setDevice({ phone: false });
    render(<CheckInstallButton />);
    fireEvent.click(screen.getByRole('button', { name: '집신체크 앱 받기' }));
    const dialog = await screen.findByRole('dialog', { name: '휴대폰에 집신체크 앱 받기' });
    await waitFor(() => expect(within(dialog).getByRole('img', { name: /QR/ }).innerHTML).toContain(`${window.location.origin}/ck?install=1`));
    expect(within(dialog).getAllByRole('listitem')).toHaveLength(3);
    expect(within(dialog).getByText(/앱스토어 앱이 아닌 웹앱/)).toBeInTheDocument();
  });

  it('브라우저가 설치를 지원하면 "이 PC에 설치하기"가 실제 설치를 요청한다', async () => {
    setDevice({ phone: false });
    render(<CheckInstallButton />);
    const event = installEvent('accepted');
    act(() => { window.dispatchEvent(event); });
    fireEvent.click(screen.getByRole('button', { name: '집신체크 앱 받기' }));
    fireEvent.click(await screen.findByRole('button', { name: '이 PC에 설치하기' }));
    await waitFor(() => expect(event.prompt).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole('button', { name: '집신체크 앱 설치됨' })).toBeDisabled());
  });

  it('설치를 지원하지 않는 브라우저는 메뉴 안내로 바꿔 보여준다', async () => {
    setDevice({ phone: false });
    render(<CheckInstallButton />);
    fireEvent.click(screen.getByRole('button', { name: '집신체크 앱 받기' }));
    fireEvent.click(await screen.findByRole('button', { name: '이 PC에 설치하기' }));
    expect(await screen.findByText(/주소창 오른쪽의 설치 아이콘/)).toBeInTheDocument();
  });

  it('닫으면 원래 버튼으로 초점이 돌아온다', async () => {
    setDevice({ phone: false });
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { cb(0); return 0; });
    render(<CheckInstallButton />);
    const trigger = screen.getByRole('button', { name: '집신체크 앱 받기' });
    fireEvent.click(trigger);
    fireEvent.click(await screen.findByRole('button', { name: '닫기' }));
    await waitFor(() => expect(trigger).toHaveFocus());
    raf.mockRestore();
  });
});

describe('TEST-CK-INSTALL-004 휴대폰에서 앱 받기', () => {
  it('QR로 열면 홈 화면 추가 안내가 자동으로 열리고 주소의 install 표시는 지운다', async () => {
    setDevice({ phone: true });
    window.history.replaceState({ zipsinCheckScreen: 'start' }, '', '/ck?install=1&ref=qr');
    render(<CheckInstallButton />);
    const dialog = await screen.findByRole('dialog', { name: '홈 화면에 집신체크 추가하기' });
    expect(within(dialog).getByRole('button', { name: '집신체크 앱 설치하기' })).toBeInTheDocument();
    expect(window.location.search).toBe('?ref=qr');
    expect(window.history.state).toEqual({ zipsinCheckScreen: 'start' });
    expect(within(dialog).queryByText('아이폰(Safari)')).toBeNull();
  });

  it('주소 정리 때 화면 상태는 남기고 Next 내부 표시는 빼서 Next가 새 주소를 알게 한다', async () => {
    setDevice({ phone: true });
    window.history.replaceState({ zipsinCheckScreen: 'list', __NA: true }, '', '/ck?install=1');
    render(<CheckInstallButton />);
    await screen.findByRole('dialog', { name: '홈 화면에 집신체크 추가하기' });
    expect(window.history.state).toEqual({ zipsinCheckScreen: 'list' });
    expect(window.location.search).toBe('');
  });

  it('아이폰에는 아이폰 안내만, 안드로이드 설치 버튼은 보여주지 않는다', async () => {
    setDevice({ phone: true });
    Object.defineProperty(window.navigator, 'userAgent', { configurable: true, value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari/604.1' });
    render(<CheckInstallButton />);
    fireEvent.click(screen.getByRole('button', { name: '집신체크 앱 받기' }));
    const dialog = await screen.findByRole('dialog', { name: '홈 화면에 집신체크 추가하기' });
    expect(within(dialog).getByText('아이폰(Safari)')).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: '집신체크 앱 설치하기' })).toBeNull();
    expect(within(dialog).getByText(/홈 화면에 집신체크 아이콘/)).toBeInTheDocument();
  });

  it('갤럭시에서 "집신체크 앱 설치하기"를 누르면 설치를 요청한다', async () => {
    setDevice({ phone: true });
    render(<CheckInstallButton />);
    const event = installEvent('dismissed');
    act(() => { window.dispatchEvent(event); });
    fireEvent.click(screen.getByRole('button', { name: '집신체크 앱 받기' }));
    fireEvent.click(await screen.findByRole('button', { name: '집신체크 앱 설치하기' }));
    await waitFor(() => expect(event.prompt).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: '집신체크 앱 받기' })).toBeEnabled();
  });

  it('이미 설치한 앱 안에서는 설치됨으로 표시하고 QR 요청도 무시한다', async () => {
    setDevice({ phone: true, standalone: true });
    window.history.replaceState(null, '', '/ck?install=1');
    render(<CheckInstallButton />);
    await waitFor(() => expect(screen.getByRole('button', { name: '집신체크 앱 설치됨' })).toBeDisabled());
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('TEST-CK-INSTALL-006 오래된 브라우저', () => {
  it('화면 판별 기능이 없어도 앱 받기 버튼과 QR 안내가 열린다', async () => {
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: undefined });
    Object.defineProperty(window.navigator, 'userAgent', { configurable: true, value: 'Mozilla/5.0 (Windows NT 10.0)' });
    render(<CheckInstallButton />);
    fireEvent.click(screen.getByRole('button', { name: '집신체크 앱 받기' }));
    expect(await screen.findByRole('dialog', { name: '휴대폰에 집신체크 앱 받기' })).toBeInTheDocument();
  });
});
