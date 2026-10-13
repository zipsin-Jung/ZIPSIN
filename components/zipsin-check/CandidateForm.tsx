'use client';

import {useState} from 'react';
import type {CandidateV2, IntakeMode} from '@/lib/zipsin-check/types';
import styles from './ZipsinCheck.module.css';

export type CandidateDraft = {
  intakeMode: IntakeMode;
  alias: string;
  discoverySource: string;
  location: string;
  transactionType: string;
  depositWon?: number;
  monthlyRentWon?: number;
  maintenanceFeeWon?: number;
  commuteMinutes?: number;
  moveInDate: string;
  contactName: string;
  phone: string;
  listingUrl: string;
};

const DISCOVERY = ['', '당근', '네이버부동산', '직방', '다방', '부동산', '지인', '기타'];
const MAX_WON = 10_000_000_000_000;

function initialDraft(candidate?: CandidateV2): CandidateDraft {
  return {
    intakeMode: candidate?.intakeMode ?? 'simple', alias: candidate?.alias ?? '', discoverySource: candidate?.listing.discoverySource ?? '',
    location: candidate?.listing.location ?? '', transactionType: candidate?.terms.transactionType ?? '', depositWon: candidate?.terms.depositWon,
    monthlyRentWon: candidate?.terms.monthlyRentWon, maintenanceFeeWon: candidate?.terms.maintenanceFeeWon, commuteMinutes: candidate?.commute.minutes,
    moveInDate: candidate?.terms.moveInDate ?? '', contactName: candidate?.contact.name ?? '', phone: candidate?.contact.phone ?? '', listingUrl: candidate?.listing.listingUrl ?? '',
  };
}

export default function CandidateForm({initial, onSubmit, onCancel}: {initial?: CandidateV2; onSubmit: (draft: CandidateDraft) => void; onCancel?: () => void}) {
  const [draft, setDraft] = useState(() => initialDraft(initial));
  const [error, setError] = useState('');
  const set = <K extends keyof CandidateDraft>(key: K, value: CandidateDraft[K]) => setDraft((current) => ({...current, [key]: value}));
  const number = (value: string) => value === '' ? undefined : Number(value);
  const submit = () => {
    const money = [draft.depositWon, draft.monthlyRentWon, draft.maintenanceFeeWon];
    if (money.some((value) => value !== undefined && (!Number.isSafeInteger(value) || value < 0 || value > MAX_WON))) {
      setError('금액은 0원 이상의 올바른 숫자로 입력해 주세요.'); return;
    }
    if (draft.commuteMinutes !== undefined && (!Number.isSafeInteger(draft.commuteMinutes) || draft.commuteMinutes < 0 || draft.commuteMinutes > 1440)) {
      setError('출퇴근 시간을 확인해 주세요.'); return;
    }
    setError(''); onSubmit(draft);
  };
  return <section className={styles.candidateForm} aria-labelledby="candidate-form-title">
    <h1 id="candidate-form-title">{initial ? '집 정보 수정' : '새 집 등록'}</h1>
    <fieldset className={styles.modeChoice}><legend>기록할 정보</legend>{(['simple', 'detailed'] as const).map((mode) => <label key={mode}><input type="radio" name="mode" checked={draft.intakeMode === mode} onChange={() => set('intakeMode', mode)}/><span>{mode === 'simple' ? '간단하게' : '상세하게'}</span></label>)}</fieldset>
    <label className={styles.formField}>집 별명 <input value={draft.alias} placeholder="비워두면 자동으로 지어요" onChange={(event) => set('alias', event.target.value)}/></label>
    <label className={styles.formField}>어디서 보셨나요? <select value={draft.discoverySource} onChange={(event) => set('discoverySource', event.target.value)}>{DISCOVERY.map((value) => <option key={value} value={value}>{value || '선택 안 함'}</option>)}</select></label>
    {draft.intakeMode === 'detailed' && <div className={styles.detailFields}>
      <label className={styles.formField}>위치 <input value={draft.location} onChange={(event) => set('location', event.target.value)}/></label>
      <label className={styles.formField}>거래 유형 <select value={draft.transactionType} onChange={(event) => set('transactionType', event.target.value)}><option value="">선택 안 함</option><option>월세</option><option>전세</option><option>매매</option></select></label>
      <label className={styles.formField}>보증금 <input type="number" value={draft.depositWon ?? ''} onChange={(event) => set('depositWon', number(event.target.value))}/></label>
      <label className={styles.formField}>월세 <input type="number" value={draft.monthlyRentWon ?? ''} onChange={(event) => set('monthlyRentWon', number(event.target.value))}/></label>
      <label className={styles.formField}>관리비 <input type="number" value={draft.maintenanceFeeWon ?? ''} onChange={(event) => set('maintenanceFeeWon', number(event.target.value))}/></label>
      <label className={styles.formField}>출퇴근 분 <input type="number" value={draft.commuteMinutes ?? ''} onChange={(event) => set('commuteMinutes', number(event.target.value))}/></label>
      <label className={styles.formField}>입주 가능일 <input type="date" value={draft.moveInDate} onChange={(event) => set('moveInDate', event.target.value)}/></label>
      <label className={styles.formField}>담당자 <input value={draft.contactName} onChange={(event) => set('contactName', event.target.value)}/></label>
      <label className={styles.formField}>담당자 연락처 <input inputMode="tel" value={draft.phone} onChange={(event) => set('phone', event.target.value)}/></label>
      <label className={styles.formField}>매물 링크 <input type="url" value={draft.listingUrl} onChange={(event) => set('listingUrl', event.target.value)}/></label>
      <p className={styles.localOnly}>주소와 연락처는 이 브라우저에만 저장되며 자동 전송되지 않아요.</p>
    </div>}
    {error && <p role="alert" className={styles.formError}>{error}</p>}
    <div className={styles.formActions}>{onCancel && <button type="button" onClick={onCancel}>취소</button>}<button type="button" className={styles.formPrimary} onClick={submit}>{initial ? '저장' : '체크 시작'}</button></div>
  </section>;
}
