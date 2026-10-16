'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './InstallAppButton.module.css';

export type GuideVariant = 'desktop' | 'ios-guide' | 'generic-guide';

type InstallGuideDialogProps = {
  variant: GuideVariant;
  open: boolean;
  onClose: () => void;
  /** 브라우저가 바로 설치 창을 띄울 수 있을 때만 true(크롬·삼성 인터넷·PC 크롬). */
  canPrompt: boolean;
  onInstall: () => void;
  /** PC에서 휴대폰으로 찍을 주소(지금 보고 있는 주소 기준). */
  qrUrl: string;
};

const TITLES: Record<GuideVariant, string> = {
  desktop: '휴대폰에 집신 앱 받기',
  'ios-guide': '홈 화면에 집신 추가하기',
  'generic-guide': '홈 화면에 집신 추가하기',
};

function useQrImage(url: string, enabled: boolean) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled || !url) return;
    let cancelled = false;
    import('qrcode')
      .then((qr) => qr.toString(url, { type: 'svg', margin: 1, color: { dark: '#10231d', light: '#ffffff' } }))
      .then((svg) => { if (!cancelled) setSrc(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`); })
      .catch(() => { if (!cancelled) setSrc(null); });
    return () => { cancelled = true; };
  }, [url, enabled]);
  return src;
}

// 2026-10-16 승인 시안 ⑩: PC에서는 QR, 휴대폰에서는 홈 화면 추가 안내.
export function InstallGuideDialog({ variant, open, onClose, canPrompt, onInstall, qrUrl }: InstallGuideDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const qrSrc = useQrImage(qrUrl, open && variant === 'desktop');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      titleRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const close = () => dialogRef.current?.close();

  return (
    <dialog
      aria-labelledby="install-guide-title"
      className={styles.dialog}
      onCancel={(event) => {
        event.preventDefault();
        dialogRef.current?.close();
      }}
      onClose={onClose}
      ref={dialogRef}
    >
      <div className={styles.dialogPanel}>
        <p className={styles.eyebrow}>바탕화면에서 바로 시작하기</p>
        <h2 className={styles.dialogTitle} id="install-guide-title" ref={titleRef} tabIndex={-1}>
          {TITLES[variant]}
        </h2>

        {variant === 'desktop' && (
          <>
            <p className={styles.lead}>휴대폰 카메라로 아래 QR을 찍으면 집신이 열리고, 홈 화면에 추가하는 방법이 바로 나와요.</p>
            <div className={styles.qrBox}>
              {qrSrc
                ? <img alt="휴대폰으로 찍으면 집신 설치 안내가 열리는 QR코드" className={styles.qrImage} height={200} src={qrSrc} width={200} />
                : <span aria-hidden="true" className={styles.qrPlaceholder} />}
            </div>
            <p className={styles.qrUrl}>QR이 안 찍히면 휴대폰에서 <strong>{qrUrl.replace(/^https?:\/\//, '').replace(/\/\?install=1$/, '')}</strong>에 들어가 주세요.</p>
            <ol className={styles.steps}>
              <li><strong>1</strong><span>휴대폰 기본 카메라를 켜고 QR에 비춰요.</span></li>
              <li><strong>2</strong><span>화면에 뜬 집신 링크를 눌러요.</span></li>
              <li><strong>3</strong><span>열린 안내대로 ‘홈 화면에 추가’를 눌러요.</span></li>
            </ol>
          </>
        )}

        {variant === 'ios-guide' && (
          <ol className={styles.steps}>
            <li><strong>1</strong><span>Safari 아래 가운데 공유 버튼을 누르세요.</span></li>
            <li><strong>2</strong><span>‘홈 화면에 추가’를 선택하세요.</span></li>
            <li><strong>3</strong><span>오른쪽 위 ‘추가’를 누르세요.</span></li>
          </ol>
        )}

        {variant === 'generic-guide' && !canPrompt && (
          <ol className={styles.steps}>
            <li><strong>1</strong><span>브라우저 오른쪽 위(또는 아래) 메뉴를 여세요.</span></li>
            <li><strong>2</strong><span>‘앱 설치’ 또는 ‘홈 화면에 추가’를 선택하세요.</span></li>
          </ol>
        )}
        {variant === 'generic-guide' && canPrompt && (
          <p className={styles.lead}>아래 버튼을 누르면 바탕화면에 집신 아이콘이 생겨요.</p>
        )}

        <p className={styles.notice}>
          앱스토어 앱이 아닌 웹앱 설치이며, 집신 사용에는 인터넷 연결이 필요합니다.
        </p>
        <div className={styles.dialogActions}>
          {canPrompt && (
            <button className={styles.closeButton} onClick={onInstall} type="button">
              {variant === 'desktop' ? '이 PC에 설치하기' : '집신 앱 설치하기'}
            </button>
          )}
          <button className={canPrompt ? styles.secondaryButton : styles.closeButton} onClick={close} type="button">
            {canPrompt ? '닫기' : '확인'}
          </button>
        </div>
      </div>
    </dialog>
  );
}
