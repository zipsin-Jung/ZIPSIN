'use client';
import {useEffect, useRef} from 'react';
import styles from './ZipsinCheck.module.css';
import {isAccountOpen} from '@/lib/site/account-launch';

type SaveChoiceSheetProps = {
  accountHref: string;
  canSaveToAccount: boolean;
  onAccount: () => boolean;
  onKeepLocal: () => void;
  onClose: () => void;
};

/** 저장 두 종류: 집신 계정(로그인)과 이 휴대폰(자동 저장). 로그인은 원할 때만. */
export default function SaveChoiceSheet({accountHref, canSaveToAccount, onAccount, onKeepLocal, onClose}: SaveChoiceSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal?.();
    titleRef.current?.focus();
  }, []);
  return <dialog ref={dialogRef} className={styles.saveSheet} aria-labelledby="save-choice-title" onClose={onClose} onCancel={event => {event.preventDefault(); dialogRef.current?.close();}} onClick={event => {if (event.target === dialogRef.current) dialogRef.current?.close();}}>
    <div className={styles.saveSheetPanel}>
      <span className={styles.saveGrab} aria-hidden="true"/>
      <h2 id="save-choice-title" ref={titleRef} tabIndex={-1}>어디에 저장할까요?</h2>
      <p className={styles.saveLead}>지금 체크한 내용은 이미 이 휴대폰에 저장돼 있어요.</p>
      <section className={`${styles.saveOption} ${styles.saveRecommended}`} aria-labelledby="save-account-title">
        <h3 id="save-account-title">☁️ 집신 계정에 저장 <em>추천</em></h3>
        <ul><li>다른 휴대폰·PC에서도 그대로 보기</li><li>사진까지 안전하게 보관</li><li>계약하면 집신에서 이어서 관리</li></ul>
        {!isAccountOpen()
          ? <button type="button" className={styles.savePrimary} disabled>집신 계정 저장 준비 중</button>
          : canSaveToAccount
          ? <a className={styles.savePrimary} href={accountHref} onClick={event => {if (!onAccount()) event.preventDefault();}}>로그인하고 저장</a>
          : <button type="button" className={styles.savePrimary} disabled>로그인하고 저장</button>}
        <small>{isAccountOpen() ? '처음이면 1분 회원가입' : '곧 열려요. 지금 체크한 내용은 이 휴대폰에 그대로 남아요.'}</small>
      </section>
      <section className={styles.saveOption} aria-labelledby="save-local-title">
        <h3 id="save-local-title">📱 이 휴대폰에만 두기</h3>
        <ul><li>로그인 없이 바로 사용</li><li className={styles.saveWarn}>브라우저 기록을 지우면 사라질 수 있어요</li></ul>
        <button type="button" className={styles.saveSecondary} onClick={onKeepLocal}>이대로 두고 내가 본 집으로</button>
      </section>
    </div>
  </dialog>;
}
