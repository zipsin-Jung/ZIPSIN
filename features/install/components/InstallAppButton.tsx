'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Check } from 'lucide-react';
import {
  hasInstallQuery,
  installLandingUrl,
  INSTALL_QUERY,
  isIosLike,
  isMobileLike,
  resolveInstallMode,
  type InstallMode,
} from '@/features/install/install-state';
import { InstallGuideDialog, type GuideVariant } from './InstallGuideDialog';
import styles from './InstallAppButton.module.css';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export function InstallAppButton() {
  const [mode, setMode] = useState<InstallMode>('generic-guide');
  const [guideOpen, setGuideOpen] = useState(false);
  const [desktop, setDesktop] = useState(false);
  const [canPrompt, setCanPrompt] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const promptEventRef = useRef<BeforeInstallPromptEvent | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const iosRef = useRef(false);

  useEffect(() => {
    const displayMode = window.matchMedia('(display-mode: standalone)');
    const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
    const ios = isIosLike(navigator);
    const mobile = isMobileLike(navigator);
    const standalone = displayMode.matches || navigatorWithStandalone.standalone === true;
    iosRef.current = ios;
    setDesktop(!mobile);
    setQrUrl(installLandingUrl(window.location.origin));
    setMode(resolveInstallMode({ promptAvailable: false, ios, standalone }));

    // QR로 들어온 휴대폰: 설치 안내를 바로 연다. 주소의 ?install=1은 지워 새로고침 때 다시 뜨지 않게 한다.
    if (mobile && !standalone && hasInstallQuery(window.location.search)) {
      setGuideOpen(true);
      const url = new URL(window.location.href);
      url.searchParams.delete(INSTALL_QUERY);
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      promptEventRef.current = event as BeforeInstallPromptEvent;
      setCanPrompt(true);
      setMode(resolveInstallMode({ promptAvailable: true, ios: iosRef.current, standalone: false }));
    };
    const handleInstalled = () => {
      promptEventRef.current = null;
      setCanPrompt(false);
      setGuideOpen(false);
      setMode('installed');
    };
    const handleDisplayMode = (event: MediaQueryListEvent) => {
      if (event.matches) handleInstalled();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    displayMode.addEventListener?.('change', handleDisplayMode);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
      displayMode.removeEventListener?.('change', handleDisplayMode);
    };
  }, []);

  const closeGuide = useCallback(() => {
    setGuideOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  const runPrompt = useCallback(async () => {
    const promptEvent = promptEventRef.current;
    if (!promptEvent) {
      setGuideOpen(true);
      return;
    }
    promptEventRef.current = null;
    setCanPrompt(false);
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === 'accepted') {
        setGuideOpen(false);
        setMode('installed');
      } else {
        setMode(resolveInstallMode({ promptAvailable: false, ios: iosRef.current, standalone: false }));
      }
    } catch {
      setMode(resolveInstallMode({ promptAvailable: false, ios: iosRef.current, standalone: false }));
      setGuideOpen(true);
    }
  }, []);

  const handleClick = async () => {
    if (mode === 'installed') return;
    // PC: 휴대폰으로 찍을 QR을 먼저 보여 준다(그 안에 "이 PC에 설치하기"도 있다).
    if (desktop) {
      setGuideOpen(true);
      return;
    }
    if (mode === 'prompt-ready' && promptEventRef.current) {
      await runPrompt();
      return;
    }
    setGuideOpen(true);
  };

  const variant: GuideVariant = desktop ? 'desktop' : mode === 'ios-guide' ? 'ios-guide' : 'generic-guide';
  const installed = mode === 'installed';

  return (
    <>
      <button
        aria-label={installed ? '앱 설치됨' : '앱으로 다운로드'}
        className={styles.installButton}
        disabled={installed}
        onClick={handleClick}
        ref={triggerRef}
        type="button"
      >
        {installed ? <Check aria-hidden="true" /> : <Download aria-hidden="true" />}
        <span className={styles.fullLabel}>{installed ? '앱 설치됨' : '앱으로 다운로드'}</span>
        <span className={styles.compactLabel}>{installed ? '설치됨' : '앱 받기'}</span>
      </button>
      <InstallGuideDialog
        canPrompt={canPrompt}
        onClose={closeGuide}
        onInstall={runPrompt}
        open={guideOpen}
        qrUrl={qrUrl}
        variant={variant}
      />
    </>
  );
}
