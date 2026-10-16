'use client';

import { useEffect, useRef, useState } from 'react';
import styles from '@/components/PublicHome.module.css';

// 준비 중인 서비스: 누르면 화면 가운데에 "준비 중" 안내만 보여 준다(2026-10-16 사용자 요청).
export function ComingSoonButton({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = `soon-${name}`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <button className={styles.serviceLink} onClick={() => setOpen(true)} ref={triggerRef} type="button">{name}</button>
      <dialog
        aria-labelledby={titleId}
        className={styles.soonDialog}
        onClick={(event) => { if (event.target === dialogRef.current) dialogRef.current?.close(); }}
        onClose={() => { setOpen(false); triggerRef.current?.focus(); }}
        ref={dialogRef}
      >
        <div className={styles.soonPanel}>
          <p className={styles.soonName}>{name}</p>
          <h2 className={styles.soonTitle} id={titleId}>준비 중이에요</h2>
          <button className={styles.soonClose} onClick={() => dialogRef.current?.close()} type="button">확인</button>
        </div>
      </dialog>
    </>
  );
}
