'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { isIosLike } from '@/features/install/install-state';
import { isPhoneLike } from '@/features/install/install-target';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export type InstallResult = 'accepted' | 'dismissed' | 'unavailable';
export type PhonePlatform = 'ios' | 'android' | 'other';

/** Browser install state shared by install buttons: installed, prompt available, phone or computer. */
export function useInstallPrompt() {
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [canPrompt, setCanPrompt] = useState(false);
  const [phone, setPhone] = useState(false);
  const [platform, setPlatform] = useState<PhonePlatform>('other');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Older browsers (and test DOMs) may lack matchMedia; treat that as "not installed, not touch".
    const media = (query: string) => (typeof window.matchMedia === 'function' ? window.matchMedia(query) : null);
    const displayMode = media('(display-mode: standalone)');
    const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
    setInstalled(Boolean(displayMode?.matches) || navigatorWithStandalone.standalone === true);
    const ios = isIosLike(navigator);
    setPlatform(ios ? 'ios' : /Android/i.test(navigator.userAgent) ? 'android' : 'other');
    setPhone(ios || isPhoneLike({
      userAgent: navigator.userAgent,
      coarsePointer: Boolean(media('(pointer: coarse)')?.matches),
    }));
    setReady(true);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      promptRef.current = event as BeforeInstallPromptEvent;
      setCanPrompt(true);
    };
    const onInstalled = () => {
      promptRef.current = null;
      setCanPrompt(false);
      setInstalled(true);
    };
    const onDisplayMode = (event: MediaQueryListEvent) => { if (event.matches) onInstalled(); };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    displayMode?.addEventListener?.('change', onDisplayMode);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      displayMode?.removeEventListener?.('change', onDisplayMode);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<InstallResult> => {
    const event = promptRef.current;
    if (!event) return 'unavailable';
    // A prompt event can be used only once.
    promptRef.current = null;
    setCanPrompt(false);
    try {
      await event.prompt();
      const choice = await event.userChoice;
      if (choice.outcome === 'accepted') setInstalled(true);
      return choice.outcome;
    } catch {
      return 'unavailable';
    }
  }, []);

  return { ready, installed, canPrompt, phone, platform, promptInstall };
}
