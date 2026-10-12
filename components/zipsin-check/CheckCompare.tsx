'use client';

import {useEffect, useRef} from 'react';
import {compareCandidates} from '@/lib/zipsin-check/state';
import {CORE_ITEM_IDS} from '@/lib/zipsin-check/catalog';
import type {Candidate, CheckStatus} from '@/lib/zipsin-check/types';
import styles from './ZipsinCheck.module.css';

type Props = {candidates: Candidate[]; onBack: () => void};
const LABEL: Record<CheckStatus, string> = {confirmed: '확인됨', caution: '주의', unverified: '미확인', expert: '전문가 확인'};
const MARK: Record<CheckStatus, string> = {confirmed: '✓', caution: '!', unverified: '?', expert: '↗'};

export default function CheckCompare({candidates, onBack}: Props) {
  const active = candidates.filter((candidate) => !candidate.archived).slice(0, 3);
  const rows = compareCandidates(active);
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headingRef.current?.focus(); }, []);
  return (
    <main className={styles.compare}>
      <button type="button" className={styles.back} onClick={onBack}>← 요약으로 돌아가기</button>
      <header><p>최대 3채 · 공통 핵심 기준</p><h1 ref={headingRef} tabIndex={-1}>후보 집 비교</h1><span>확인 깊이가 달라도 공통 항목만 비교해요. 추가 항목 수가 달라도 불리하게 계산하지 않아요.</span></header>
      <section className={styles.compareCards} aria-label="후보 집 카드">
        {active.map((candidate,index)=>{const coreAnswers=CORE_ITEM_IDS.map(id=>candidate.answers[id]);return <article key={candidate.id} aria-label={`${candidate.alias} 비교 카드`} className={styles.compareCard} data-tone={index%3}>
          <span>후보 {index+1}</span><h2>{candidate.alias}</h2><p>{candidate.locationLabel||'주소·건물명 미입력'}</p>
          <div>{candidate.transactionType&&<b>{candidate.transactionType}</b>}{candidate.housingType&&<b>{candidate.housingType}</b>}</div>
          <ul><li>✓ 확인됨 {coreAnswers.filter(answer=>answer?.status==='confirmed').length}</li><li>! 주의 {coreAnswers.filter(answer=>answer?.status==='caution').length}</li><li>↗ 전문가 확인 {coreAnswers.filter(answer=>answer?.status==='expert').length}</li><li>? 미확인 {coreAnswers.filter(answer=>!answer||answer.status==='unverified').length}</li></ul>
        </article>;})}
      </section>
      <div className={styles.tableWrap}>
        <table>
          <thead><tr><th scope="col">확인 항목</th>{active.map((candidate) => <th scope="col" key={candidate.id}>{candidate.alias}</th>)}</tr></thead>
          <tbody>{rows.map((row) => <tr key={row.item.id}><th scope="row">{row.item.title}</th>{active.map((candidate) => {
            const status = row.answers[candidate.id]?.status ?? 'unverified';
            return <td key={candidate.id} data-status={status}><b aria-hidden="true">{MARK[status]}</b><span>{LABEL[status]}</span></td>;
          })}</tr>)}</tbody>
        </table>
      </div>
      <aside className={styles.disclaimer}>순위나 안전점수를 만들지 않아요. 주의와 미확인을 따로 보고 다음 확인 계획을 세우세요.</aside>
    </main>
  );
}
