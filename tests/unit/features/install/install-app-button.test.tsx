import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InstallAppButton } from '@/features/install/components/InstallAppButton';

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
  });

  it('TEST-PWA-INSTALL-001 준비 이벤트를 자동 실행하지 않고 사용자 클릭 때 한 번만 요청한다', async () => {
    render(<InstallAppButton />);
    const event = createInstallEvent('accepted');

    act(() => window.dispatchEvent(event));
    expect(event.prompt).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '앱으로 다운로드' }));
    await waitFor(() => expect(event.prompt).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole('button', { name: '앱 설치됨' })).toBeDisabled());
  });

  it('TEST-PWA-CHOICE-001 사용자가 설치를 취소해도 설치 완료로 표시하지 않는다', async () => {
    render(<InstallAppButton />);
    const event = createInstallEvent('dismissed');

    act(() => window.dispatchEvent(event));
    fireEvent.click(screen.getByRole('button', { name: '앱으로 다운로드' }));

    await waitFor(() => expect(event.prompt).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('button', { name: '앱 설치됨' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '앱으로 다운로드' })).toBeEnabled();
  });

  it('TEST-PWA-PROMPT-ERROR-001 브라우저 설치 요청이 실패하면 일반 설치 안내로 복구한다', async () => {
    render(<InstallAppButton />);
    const event = createRejectedInstallEvent();

    act(() => window.dispatchEvent(event));
    fireEvent.click(screen.getByRole('button', { name: '앱으로 다운로드' }));

    await waitFor(() => expect(event.prompt).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole('dialog', { name: '집신 앱 설치 안내' })).toHaveAttribute('open');
    expect(screen.getByRole('button', { name: '앱으로 다운로드' })).toBeEnabled();
  });

  it('지원하지 않는 브라우저는 온라인 전용 안내를 열고 닫으면 버튼으로 포커스를 돌린다', async () => {
    render(<InstallAppButton />);
    const trigger = screen.getByRole('button', { name: '앱으로 다운로드' });

    fireEvent.click(trigger);

    const dialog = screen.getByRole('dialog', { name: '집신 앱 설치 안내' });
    const title = screen.getByRole('heading', { name: '집신 앱 설치 안내' });
    expect(dialog).toHaveAttribute('open');
    expect(title).toHaveFocus();
    expect(screen.getByText(/앱스토어 앱이 아닌 웹앱/)).toBeInTheDocument();
    expect(screen.getByText(/인터넷 연결이 필요/)).toBeInTheDocument();

    fireEvent(dialog, new Event('cancel', { cancelable: true }));
    await waitFor(() => expect(dialog).not.toHaveAttribute('open'));
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
