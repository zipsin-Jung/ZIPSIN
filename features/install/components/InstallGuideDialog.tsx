'use client';

import { useEffect, useRef } from 'react';
import type { InstallMode } from '@/features/install/install-state';
import styles from './InstallAppButton.module.css';

type GuideMode = Extract<InstallMode, 'ios-guide' | 'generic-guide'>;

type InstallGuideDialogProps = {
  mode: GuideMode;
  open: boolean;
  onClose: () => void;
};

export function InstallGuideDialog({ mode, open, onClose }: InstallGuideDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

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
        <p className={styles.eyebrow}>홈 화면에서 바로 시작하기</p>
        <h2 className={styles.dialogTitle} id="install-guide-title" ref={titleRef} tabIndex={-1}>
          집신 앱 설치 안내
        </h2>
        {mode === 'ios-guide' ? (
          <ol className={styles.steps}>
            <li><strong>1</strong><span>Safari 아래의 공유 버튼을 누르세요.</span></li>
            <li><strong>2</strong><span>‘홈 화면에 추가’를 선택하세요.</span></li>
            <li><strong>3</strong><span>오른쪽 위 ‘추가’를 누르세요.</span></li>
          </ol>
        ) : (
          <ol className={styles.steps}>
            <li><strong>1</strong><span>브라우저 오른쪽 위 메뉴를 여세요.</span></li>
            <li><strong>2</strong><span>‘앱 설치’ 또는 ‘홈 화면에 추가’를 선택하세요.</span></li>
          </ol>
        )}
        <p className={styles.notice}>
          앱스토어 앱이 아닌 웹앱 설치이며, 집신 사용에는 인터넷 연결이 필요합니다.
        </p>
        <button className={styles.closeButton} onClick={() => dialogRef.current?.close()} type="button">
          확인
        </button>
      </div>
    </dialog>
  );
}
