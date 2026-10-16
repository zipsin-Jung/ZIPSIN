'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Download } from 'lucide-react';
import { buildInstallUrl, INSTALL_QUERY, readInstallRequest } from '@/features/install/install-target';
import { useInstallPrompt } from '@/features/install/use-install-prompt';
import { CheckInstallDialog } from './CheckInstallDialog';

const APP_NAME = '집신체크';
const APP_PATH = '/ck';

/** "앱 받기" for 집신체크: QR on computers, home-screen guide on phones (opened automatically from the QR). */
export function CheckInstallButton() {
  const { ready, installed, phone, platform, promptInstall } = useInstallPrompt();
  const [open, setOpen] = useState(false);
  const [installUrl, setInstallUrl] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const handledQrRef = useRef(false);

  useEffect(() => {
    if (!ready || handledQrRef.current) return;
    handledQrRef.current = true;
    setInstallUrl(buildInstallUrl(window.location.origin, APP_PATH));
    if (!readInstallRequest(window.location.search)) return;
    // Drop ?install=1 so a refresh or shared link does not reopen the guide. Keep 집신체크's own
    // history state, but not Next's internal "__NA" flag: without it Next syncs its router to the new URL.
    const url = new URL(window.location.href);
    url.searchParams.delete(INSTALL_QUERY);
    const { __NA: _nextInternal, ...appState } = (window.history.state ?? {}) as Record<string, unknown>;
    window.history.replaceState(appState, '', `${url.pathname}${url.search}${url.hash}`);
    if (!installed) setOpen(true);
  }, [ready, installed]);

  useEffect(() => { if (installed) setOpen(false); }, [installed]);

  const close = useCallback(() => {
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  return (
    <>
      <button
        aria-label={installed ? `${APP_NAME} 앱 설치됨` : `${APP_NAME} 앱 받기`}
        disabled={installed}
        onClick={() => setOpen(true)}
        ref={triggerRef}
        type="button"
      >
        {installed ? <Check aria-hidden="true" size={15} /> : <Download aria-hidden="true" size={15} />}
        <span>{installed ? '설치됨' : '앱 받기'}</span>
      </button>
      {open ? (
        <CheckInstallDialog
          appName={APP_NAME}
          installUrl={installUrl || buildInstallUrl(window.location.origin, APP_PATH)}
          onClose={close}
          onInstall={promptInstall}
          platform={platform}
          variant={phone ? 'phone' : 'desktop'}
        />
      ) : null}
    </>
  );
}
