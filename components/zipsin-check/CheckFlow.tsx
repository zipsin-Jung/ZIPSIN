'use client';

import {useEffect, useRef, useState} from 'react';
import {getItemsForDepth} from '@/lib/zipsin-check/catalog';
import {answerItem, containsSensitiveMemo, switchDepth} from '@/lib/zipsin-check/state';
import type {Candidate, CheckStatus, EvidenceSource} from '@/lib/zipsin-check/types';
import styles from './ZipsinCheck.module.css';

type Props = {candidate: Candidate; onChange: (candidate: Candidate) => void; onFinish: () => void; onBack: () => void};
const STATUSES: {value: CheckStatus; label: string; mark: string}[] = [
  {value: 'confirmed', label: '확인됨', mark: '✓'},
  {value: 'caution', label: '주의', mark: '!'},
  {value: 'unverified', label: '확인 못함', mark: '?'},
  {value: 'expert', label: '전문가 확인', mark: '↗'},
];
const SOURCES: {value: EvidenceSource; label: string}[] = [
  {value: 'observed', label: '직접 확인했어요'},
  {value: 'explained', label: '설명을 들었어요'},
  {value: 'document', label: '서류로 확인했어요'},
  {value: 'expert', label: '전문가 확인이 필요해요'},
];

export default function CheckFlow({candidate, onChange, onFinish, onBack}: Props) {
  const items = getItemsForDepth(candidate.depth);
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [draftStatus, setDraftStatus] = useState<CheckStatus>();
  const [draftSource, setDraftSource] = useState<EvidenceSource>('observed');
  const [memo, setMemo] = useState('');
  const [warning, setWarning] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const item = items[Math.min(index, items.length - 1)];
  const saved = candidate.answers[item.id];
  const status = draftStatus ?? saved?.status;
  const source = saved?.source ?? draftSource;

  useEffect(() => {
    setExpanded(false);
    setDraftStatus(undefined);
    setDraftSource('observed');
    setMemo(candidate.answers[item.id]?.memo ?? '');
    setWarning('');
    headingRef.current?.focus();
  }, [item.id, candidate.answers]);

  function update(statusValue: CheckStatus, sourceValue: EvidenceSource, memoValue = memo) {
    onChange(answerItem(candidate, item.id, {status: statusValue, source: sourceValue, ...(memoValue.trim() ? {memo: memoValue.trim()} : {})}, new Date().toISOString()));
  }

  function chooseStatus(value: CheckStatus) {
    setDraftStatus(value);
    update(value, source);
  }

  function chooseSource(value: EvidenceSource) {
    setDraftSource(value);
    if (status) update(status, value);
  }

  function saveMemo() {
    if (!memo.trim()) return;
    if (containsSensitiveMemo(memo)) {
      setWarning('출입정보나 연락처처럼 민감할 수 있는 내용은 저장하지 않았어요. 안전한 관찰 내용만 적어 주세요.');
      return;
    }
    if (!status) return;
    setWarning('');
    update(status, source, memo);
  }

  function toggleDepth() {
    onChange(switchDepth(candidate, candidate.depth === 'quick' ? 'thorough' : 'quick', new Date().toISOString()));
  }

  function move(offset: number) {
    setIndex((current) => Math.min(Math.max(current + offset, 0), items.length - 1));
  }

  return (
    <main className={styles.flow}>
      <header className={styles.flowHeader}>
        <button type="button" onClick={onBack}>← 나가기</button>
        <div><strong>{candidate.alias}</strong><span>{index + 1} / {items.length}</span></div>
        <button type="button" onClick={toggleDepth}>{candidate.depth === 'quick' ? '더 꼼꼼히 보기' : '빠르게만 보기'}</button>
      </header>
      <div className={styles.progress} aria-label={`진행률 ${index + 1}/${items.length}`}><span style={{width: `${((index + 1) / items.length) * 100}%`}}/></div>

      <article className={styles.checkCard}>
        <p className={styles.group}>{item.group}{item.core ? ' · 공통 핵심' : ' · 추가 확인'}</p>
        <h1 ref={headingRef} tabIndex={-1} aria-label={`${candidate.alias} 체크: ${item.title}`}>{item.title}</h1>
        <p className={styles.prompt}>{item.prompt}</p>
        <button type="button" className={styles.whyButton} aria-expanded={expanded} aria-controls={`why-${item.id}`} onClick={() => setExpanded((open) => !open)}>왜 확인하나요?</button>
        {expanded && <section id={`why-${item.id}`} className={styles.explanation}>
          <div><strong>왜</strong><p>{item.why}</p></div>
          <div><strong>어떻게</strong><p>{item.how}</p></div>
          <div><strong>물어볼 말</strong><p>“{item.question}”</p></div>
          {item.reviewedAt && <small>확인 기준일 {item.reviewedAt} · 계약 전 최신 공식 자료를 다시 확인하세요.</small>}
        </section>}

        <section className={styles.answerSection} aria-labelledby={`answer-${item.id}`}>
          <h2 id={`answer-${item.id}`}>어땠나요?</h2>
          <div className={styles.statusGrid}>
            {STATUSES.map((option) => <button key={option.value} type="button" aria-pressed={status === option.value} onClick={() => chooseStatus(option.value)}><b aria-hidden="true">{option.mark}</b>{option.label}</button>)}
          </div>
        </section>

        <fieldset className={styles.sources}>
          <legend>확인한 근거</legend>
          {SOURCES.map((option) => <label key={option.value}><input type="radio" name={`source-${item.id}`} value={option.value} checked={source === option.value} onChange={() => chooseSource(option.value)}/><span>{option.label}</span></label>)}
        </fieldset>

        <div className={styles.memo}>
          <label htmlFor={`memo-${item.id}`}>선택 메모</label>
          <textarea id={`memo-${item.id}`} value={memo} onChange={(event) => setMemo(event.target.value)} onBlur={saveMemo} placeholder="예: 창가 오른쪽에 작은 얼룩" maxLength={300}/>
          <small>정확 주소, 연락처, 출입 비밀번호는 적지 마세요.</small>
          {warning && <p role="alert" className={styles.warning}>{warning}</p>}
        </div>
      </article>

      <nav className={styles.flowNav} aria-label="체크 항목 이동">
        <button type="button" onClick={() => move(-1)} disabled={index === 0}>이전</button>
        {index < items.length - 1 ? <button type="button" className={styles.primary} onClick={() => move(1)}>다음 항목</button> : null}
        <button type="button" className={styles.summaryButton} onClick={onFinish}>{index < items.length - 1 ? '지금까지 요약 보기' : '체크 마치기'}</button>
      </nav>
    </main>
  );
}
