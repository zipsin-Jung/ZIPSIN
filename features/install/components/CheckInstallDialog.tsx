'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import type { InstallResult, PhonePlatform } from '@/features/install/use-install-prompt';
import styles from './CheckInstallDialog.module.css';

type CheckInstallDialogProps = {
  variant: 'desktop' | 'phone';
  platform?: PhonePlatform;
  appName: string;
  installUrl: string;
  onInstall: () => Promise<InstallResult>;
  onClose: () => void;
};

const WEB_APP_NOTICE = '앱스토어 앱이 아닌 웹앱이에요. 사용하려면 인터넷 연결이 필요해요.';

export function CheckInstallDialog({ variant, platform = 'other', appName, installUrl, onInstall, onClose }: CheckInstallDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [qrSvg, setQrSvg] = useState('');
  const [menuGuide, setMenuGuide] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (variant !== 'desktop') return;
    let active = true;
    QRCode.toString(installUrl, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#10231d', light: '#ffffff' } })
      .then((svg) => { if (active) setQrSvg(svg); })
      .catch(() => { if (active) setQrSvg(''); });
    return () => { active = false; };
  }, [installUrl, variant]);

  const install = async () => {
    const result = await onInstall();
    if (result === 'accepted') dialogRef.current?.close();
    else if (result === 'unavailable') setMenuGuide(true);
  };

  const close = () => dialogRef.current?.close();
  const titleId = `install-${variant}-title`;

  return createPortal(
    <dialog
      aria-labelledby={titleId}
      className={styles.dialog}
      onCancel={(event) => { event.preventDefault(); close(); }}
      onClose={onClose}
      ref={dialogRef}
    >
      {variant === 'desktop' ? (
        <div className={styles.panel}>
          <p className={styles.eyebrow}>{appName} 앱 받기</p>
          <h2 className={styles.title} id={titleId} ref={titleRef} tabIndex={-1}>휴대폰에 {appName} 앱 받기</h2>
          <p className={styles.lead}>휴대폰 카메라로 아래 QR을 찍으면 {appName}가 열리고, 홈 화면에 추가하는 방법이 바로 나와요.</p>
          <div
            aria-label={`${appName} 설치 안내로 가는 QR 코드`}
            className={styles.qr}
            dangerouslySetInnerHTML={{ __html: qrSvg }}
            data-ready={qrSvg ? 'true' : 'false'}
            role="img"
          />
          <ol className={styles.numbered}>
            <li>휴대폰 기본 카메라를 켜고 QR에 비춰요.</li>
            <li>화면에 뜬 {appName} 링크를 눌러요.</li>
            <li>열린 안내대로 &quot;홈 화면에 추가&quot;를 눌러요.</li>
          </ol>
          {menuGuide ? (
            <p className={styles.guide} role="status">
              이 브라우저는 버튼으로 바로 설치할 수 없어요. Chrome·Edge는 주소창 오른쪽의 설치 아이콘을, Mac Safari는 메뉴의 &apos;Dock에 추가&apos;를 눌러 주세요.
            </p>
          ) : null}
          <div className={styles.actions}>
            <button className={styles.primary} onClick={install} type="button">이 PC에 설치하기</button>
            <button className={styles.secondary} onClick={close} type="button">닫기</button>
          </div>
          <p className={styles.footnote}>{WEB_APP_NOTICE}</p>
        </div>
      ) : (
        <div className={styles.panel}>
          <p className={styles.eyebrow}>{appName} 앱 받기</p>
          <h2 className={styles.title} id={titleId} ref={titleRef} tabIndex={-1}>홈 화면에 {appName} 추가하기</h2>
          {platform !== 'android' ? (
          <section aria-labelledby="install-ios-heading" className={styles.platform}>
            <h3 id="install-ios-heading">아이폰(Safari)</h3>
            <ol className={styles.numbered}>
              <li>아래 가운데 <strong>공유</strong> 버튼</li>
              <li><strong>홈 화면에 추가</strong></li>
              <li>오른쪽 위 <strong>추가</strong></li>
            </ol>
          </section>
          ) : null}
          {platform !== 'ios' ? (
          <section aria-labelledby="install-android-heading" className={styles.platform}>
            <h3 id="install-android-heading">갤럭시(크롬·삼성 인터넷)</h3>
            <button className={`${styles.primary} ${styles.wide}`} onClick={install} type="button">{appName} 앱 설치하기</button>
            {menuGuide ? (
              <p className={styles.guide} role="status">
                브라우저 메뉴(⋮ 또는 ≡)에서 &apos;홈 화면에 추가&apos; 또는 &apos;앱 설치&apos;를 눌러 주세요.
              </p>
            ) : null}
          </section>
          ) : null}
          <p className={styles.footnote}>설치하면 홈 화면에 {appName} 아이콘이 생겨요. {WEB_APP_NOTICE}</p>
          <button className={styles.textButton} onClick={close} type="button">닫기</button>
        </div>
      )}
    </dialog>,
    document.body,
  );
}
