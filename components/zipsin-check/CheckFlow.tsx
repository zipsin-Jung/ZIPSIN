'use client';

import {useEffect, useRef, useState} from 'react';
import {getItemsForDepth} from '@/lib/zipsin-check/catalog';
import {createBrowserPhotoStore, type PhotoStore} from '@/lib/zipsin-check/photo-store';
import {answerItem, containsSensitiveMemo, switchDepth} from '@/lib/zipsin-check/state';
import type {Candidate, CheckItem, CheckStatus, EvidenceSource} from '@/lib/zipsin-check/types';
import PhotoField from './PhotoField';
import styles from './ZipsinCheck.module.css';

type Props = {candidate: Candidate; onChange: (candidate: Candidate) => void; onFinish: () => void; onBack: () => void; photoStore?: PhotoStore};
const FIELD_STATUSES: {value: CheckStatus; label: string; mark: string}[] = [
  {value: 'confirmed', label: '괜찮음', mark: '✓'},
  {value: 'caution', label: '확인 필요', mark: '!'},
];
const SOURCES: {value: EvidenceSource; label: string}[] = [
  {value: 'observed', label: '직접 확인'}, {value: 'explained', label: '설명 들음'},
  {value: 'document', label: '서류 확인'}, {value: 'expert', label: '전문가 필요'},
];
const DEFAULT_PHOTO_STORE = createBrowserPhotoStore();

function CheckItemRow({item, candidate, onChange, photoStore}: {item: CheckItem; candidate: Candidate; onChange: (candidate: Candidate) => void; photoStore: PhotoStore}) {
  const saved = candidate.answers[item.id];
  const [memo, setMemo] = useState(saved?.memo ?? '');
  const [expanded, setExpanded] = useState(false);
  const [warning, setWarning] = useState('');
  const source = saved?.source ?? 'observed';

  function update(status: CheckStatus = saved?.status ?? 'unverified', nextSource: EvidenceSource = source) {
    if (containsSensitiveMemo(memo)) {
      setWarning('연락처나 출입정보는 저장하지 않았어요. 관찰 내용만 적어 주세요.');
      return;
    }
    setWarning('');
    onChange(answerItem(candidate, item.id, {status, source: nextSource, ...(memo.trim() ? {memo: memo.trim()} : {})}, new Date().toISOString()));
  }

  return <article className={styles.fieldRow} aria-labelledby={`item-${item.id}`}>
    <div className={styles.fieldQuestion}><span>{item.group}</span><h2 id={`item-${item.id}`}>{item.title}</h2><p>{item.prompt}</p></div>
    <div className={styles.fieldStatuses}>{FIELD_STATUSES.map((option) => <button key={option.value} type="button" aria-label={`${item.title} ${option.label}`} aria-pressed={saved?.status === option.value} onClick={() => update(option.value)}><b aria-hidden="true">{option.mark}</b>{option.label}</button>)}</div>
    <div className={styles.fieldTools}>
      <label htmlFor={`memo-${item.id}`}>메모</label>
      <input id={`memo-${item.id}`} aria-label={`${item.title} 짧은 메모`} value={memo} maxLength={120} placeholder="짧게 메모" onChange={(event) => setMemo(event.target.value)} onBlur={() => update()} />
      <PhotoField candidateId={candidate.id} itemId={item.id} itemTitle={item.title} store={photoStore}/>
    </div>
    {warning && <p role="alert" className={styles.warning}>{warning}</p>}
    {candidate.depth === 'thorough' && <>
      <button type="button" className={styles.detailToggle} aria-expanded={expanded} aria-controls={`detail-${item.id}`} onClick={() => setExpanded((value) => !value)}>{item.title} 자세히</button>
      {expanded && <section id={`detail-${item.id}`} className={styles.itemDetail}>
        <div className={styles.explanation}><div><strong>왜</strong><p>{item.why}</p></div><div><strong>어떻게</strong><p>{item.how}</p></div><div><strong>물어볼 말</strong><p>“{item.question}”</p></div></div>
        <fieldset className={styles.sources}><legend>확인한 근거</legend>{SOURCES.map((option) => <label key={option.value}><input type="radio" name={`source-${item.id}`} checked={source === option.value} onChange={() => update(saved?.status ?? 'unverified', option.value)}/><span>{option.label}</span></label>)}</fieldset>
      </section>}
    </>}
  </article>;
}

export default function CheckFlow({candidate, onChange, onFinish, onBack, photoStore = DEFAULT_PHOTO_STORE}: Props) {
  const items = getItemsForDepth(candidate.depth);
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headingRef.current?.focus(); }, [candidate.depth]);
  const completed = items.filter((item) => candidate.answers[item.id]?.status !== undefined && candidate.answers[item.id]?.status !== 'unverified').length;

  return <main className={styles.flow}>
    <header className={styles.fieldHeader}>
      <button type="button" onClick={onBack}>← 목록</button>
      <div><h1 ref={headingRef} tabIndex={-1}>{candidate.alias} 체크</h1><span>{completed}/{items.length} 확인 · 자동 저장</span></div>
      <button type="button" onClick={() => onChange(switchDepth(candidate, candidate.depth === 'quick' ? 'thorough' : 'quick', new Date().toISOString()))}>{candidate.depth === 'quick' ? '꼼꼼히 보기' : '간단히 보기'}</button>
    </header>
    <aside className={styles.photoNotice}>사진은 이 기기에만 저장돼요. 사람·문서·문패·비밀번호·귀중품은 찍지 마세요.</aside>
    <section className={styles.fieldList} aria-label={`${candidate.depth === 'quick' ? '현장' : '꼼꼼한'} 체크 항목`}>{items.map((item) => <CheckItemRow key={item.id} item={item} candidate={candidate} onChange={onChange} photoStore={photoStore}/>)}</section>
    <div className={styles.stickyFinish}><span>{completed}개 체크됨 · 나머지는 미확인</span><button type="button" onClick={onFinish}>방문 끝내기</button></div>
  </main>;
}
