'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Check } from 'lucide-react';
import { isIosLike, resolveInstallMode, type InstallMode } from '@/features/install/install-state';
import { InstallGuideDialog } from './InstallGuideDialog';
import styles from './InstallAppButton.module.css';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export function InstallAppButton() {
  const [mode, setMode] = useState<InstallMode>('generic-guide');
  const [guideOpen, setGuideOpen] = useState(false);
  const promptEventRef = useRef<BeforeInstallPromptEvent | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const iosRef = useRef(false);

  useEffect(() => {
    const displayMode = window.matchMedia('(display-mode: standalone)');
    const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
    const ios = isIosLike(navigator);
    const standalone = displayMode.matches || navigatorWithStandalone.standalone === true;
    iosRef.current = ios;
    setMode(resolveInstallMode({ promptAvailable: false, ios, standalone }));

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      promptEventRef.current = event as BeforeInstallPromptEvent;
      setMode(resolveInstallMode({ promptAvailable: true, ios: iosRef.current, standalone: false }));
    };
    const handleInstalled = () => {
      promptEventRef.current = null;
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

  const handleClick = async () => {
    if (mode === 'installed') return;
    const promptEvent = promptEventRef.current;

    if (mode === 'prompt-ready' && promptEvent) {
      promptEventRef.current = null;
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === 'accepted') {
        setMode('installed');
      } else {
        setMode(resolveInstallMode({ promptAvailable: false, ios: iosRef.current, standalone: false }));
      }
      return;
    }

    setGuideOpen(true);
  };

  const guideMode = mode === 'ios-guide' ? 'ios-guide' : 'generic-guide';
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
      <InstallGuideDialog mode={guideMode} onClose={closeGuide} open={guideOpen} />
    </>
  );
}
