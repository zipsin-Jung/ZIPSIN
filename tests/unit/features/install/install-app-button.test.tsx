import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InstallAppButton } from '@/features/install/components/InstallAppButton';

vi.mock('qrcode', () => ({ toString: vi.fn().mockResolvedValue('<svg xmlns="http://www.w3.org/2000/svg"></svg>') }));

const ANDROID = 'Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 Chrome/128.0 Mobile Safari/537.36';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1';
function asPhone(userAgent: string) {
  vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(userAgent);
}

type InstallChoice = 'accepted' | 'dismissed';

function createInstallEvent(choice: InstallChoice) {
  const event = new Event('beforeinstallprompt') as Event & {
    prompt: ReturnType<typeof vi.fn>;
    userChoice: Promise<{ outcome: InstallChoice; platform: string }>;
  };
  event.prompt = vi.fn().mockResolvedValue(undefined);
  event.userChoice = Promise.resolve({ outcome: choice, platform: 'web' });
  return event;
}

function createRejectedInstallEvent() {
  const event = new Event('beforeinstallprompt') as Event & {
    prompt: ReturnType<typeof vi.fn>;
    userChoice: Promise<{ outcome: InstallChoice; platform: string }>;
  };
  event.prompt = vi.fn().mockRejectedValue(new Error('native prompt unavailable'));
  event.userChoice = Promise.resolve({ outcome: 'dismissed', platform: 'web' });
  return event;
}

describe('InstallAppButton', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function close() {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    window.history.replaceState(null, '', '/');
  });

  it('TEST-PWA-INSTALL-001 휴대폰에서는 준비 이벤트를 자동 실행하지 않고 사용자 클릭 때 한 번만 요청한다', async () => {
    asPhone(ANDROID);
    render(<InstallAppButton />);
    const event = createInstallEvent('accepted');

    act(() => window.dispatchEvent(event));
    expect(event.prompt).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '앱으로 다운로드' }));
    await waitFor(() => expect(event.prompt).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole('button', { name: '앱 설치됨' })).toBeDisabled());
  });

  it('TEST-PWA-CHOICE-001 사용자가 설치를 취소해도 설치 완료로 표시하지 않는다', async () => {
    asPhone(ANDROID);
    render(<InstallAppButton />);
    const event = createInstallEvent('dismissed');

    act(() => window.dispatchEvent(event));
    fireEvent.click(screen.getByRole('button', { name: '앱으로 다운로드' }));

    await waitFor(() => expect(event.prompt).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('button', { name: '앱 설치됨' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '앱으로 다운로드' })).toBeEnabled();
  });

  it('TEST-PWA-PROMPT-ERROR-001 브라우저 설치 요청이 실패하면 설치 안내로 복구한다', async () => {
    asPhone(ANDROID);
    render(<InstallAppButton />);
    const event = createRejectedInstallEvent();

    act(() => window.dispatchEvent(event));
    fireEvent.click(screen.getByRole('button', { name: '앱으로 다운로드' }));

    await waitFor(() => expect(event.prompt).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole('dialog', { name: '홈 화면에 집신 추가하기' })).toHaveAttribute('open');
    expect(screen.getByRole('button', { name: '앱으로 다운로드' })).toBeEnabled();
  });

  // TEST-PWA-QR-001 (시안 ⑩): PC에서는 휴대폰으로 찍을 QR과 주소를 보여 준다.
  it('TEST-PWA-QR-001 PC에서 누르면 휴대폰으로 찍을 QR을 보여 주고 닫으면 버튼으로 포커스를 돌린다', async () => {
    render(<InstallAppButton />);
    const trigger = screen.getByRole('button', { name: '앱으로 다운로드' });

    fireEvent.click(trigger);

    const dialog = screen.getByRole('dialog', { name: '휴대폰에 집신 앱 받기' });
    expect(dialog).toHaveAttribute('open');
    expect(screen.getByRole('heading', { name: '휴대폰에 집신 앱 받기' })).toHaveFocus();
    expect(await screen.findByRole('img', { name: /QR코드/ })).toHaveAttribute('src', expect.stringContaining('data:image/svg+xml'));
    expect(screen.getByText(/QR이 안 찍히면/)).toHaveTextContent('localhost');
    expect(screen.getByText(/앱스토어 앱이 아닌 웹앱/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '이 PC에 설치하기' })).not.toBeInTheDocument();

    fireEvent(dialog, new Event('cancel', { cancelable: true }));
    await waitFor(() => expect(dialog).not.toHaveAttribute('open'));
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('TEST-PWA-QR-002 PC 크롬이 설치를 지원하면 QR 창 안에서 이 PC에 설치할 수 있다', async () => {
    render(<InstallAppButton />);
    const event = createInstallEvent('accepted');
    act(() => window.dispatchEvent(event));

    fireEvent.click(screen.getByRole('button', { name: '앱으로 다운로드' }));
    expect(event.prompt).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '이 PC에 설치하기' }));

    await waitFor(() => expect(event.prompt).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole('button', { name: '앱 설치됨' })).toBeDisabled());
  });

  it('TEST-PWA-QR-003 QR로 들어온 아이폰은 홈 화면 추가 안내가 바로 열리고 주소의 표시는 지워진다', async () => {
    asPhone(IPHONE);
    window.history.replaceState(null, '', '/?install=1');
    render(<InstallAppButton />);

    expect(await screen.findByRole('dialog', { name: '홈 화면에 집신 추가하기' })).toHaveAttribute('open');
    expect(screen.getByText(/공유 버튼/)).toBeInTheDocument();
    expect(window.location.search).toBe('');
  });

  it('TEST-PWA-QR-004 QR로 들어온 갤럭시는 설치 버튼 하나로 설치한다', async () => {
    asPhone(ANDROID);
    window.history.replaceState(null, '', '/?install=1');
    render(<InstallAppButton />);
    const event = createInstallEvent('accepted');
    act(() => window.dispatchEvent(event));

    fireEvent.click(await screen.findByRole('button', { name: '집신 앱 설치하기' }));
    await waitFor(() => expect(event.prompt).toHaveBeenCalledTimes(1));
  });

  it('TEST-PWA-QR-005 설치 지원이 없는 휴대폰 브라우저는 메뉴 안내를 보여 준다', () => {
    asPhone(ANDROID);
    render(<InstallAppButton />);
    fireEvent.click(screen.getByRole('button', { name: '앱으로 다운로드' }));
    expect(screen.getByText(/‘앱 설치’ 또는 ‘홈 화면에 추가’/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '확인' }));
  });
});
