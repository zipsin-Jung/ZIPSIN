'use client';

import {buildSummary} from '@/lib/zipsin-check/state';
import type {Candidate, CheckStatus} from '@/lib/zipsin-check/types';
import styles from './ZipsinCheck.module.css';

type Props = {candidate: Candidate; canCompare: boolean; onBack: () => void; onAdd: () => void; onCompare: () => void};
const SECTIONS: {status: CheckStatus; title: string; mark: string; empty: string}[] = [
  {status: 'caution', title: '주의', mark: '!', empty: '주의로 표시한 항목이 없어요.'},
  {status: 'expert', title: '전문가 확인', mark: '↗', empty: '전문 확인이 필요한 항목이 없어요.'},
  {status: 'unverified', title: '확인 못함', mark: '?', empty: '공통 핵심을 모두 확인했어요.'},
  {status: 'confirmed', title: '확인됨', mark: '✓', empty: '아직 확인됨으로 표시한 항목이 없어요.'},
];

export default function CheckSummary({candidate, canCompare, onBack, onAdd, onCompare}: Props) {
  const summary = buildSummary(candidate);
  return (
    <main className={styles.results}>
      <button type="button" className={styles.back} onClick={onBack}>← 체크로 돌아가기</button>
      <header className={styles.resultHero}>
        <p>{candidate.alias} 방문 요약</p>
        <h1>좋고 나쁨 대신,<br/>다시 볼 것을 정리했어요.</h1>
        <div className={styles.counts}>
          <span><b>!</b> 주의 {summary.caution.length}</span>
          <span><b>?</b> 미확인 {summary.unverified.length}</span>
          <span><b>↗</b> 전문가 {summary.expert.length}</span>
        </div>
      </header>

      {SECTIONS.map((section) => <section key={section.status} className={`${styles.resultSection} ${styles[section.status]}`} aria-label={`${section.title} ${summary[section.status].length}개`}>
        <h2><b aria-hidden="true">{section.mark}</b>{section.title} <span>{summary[section.status].length}</span></h2>
        {summary[section.status].length === 0 ? <p className={styles.empty}>{section.empty}</p> : <ul>{summary[section.status].map((entry) => <li key={entry.id}>
          <strong>{entry.title}</strong>
          {entry.answer.memo && <p>{entry.answer.memo}</p>}
          {(section.status === 'unverified' || section.status === 'caution' || section.status === 'expert') && <small>다음: {entry.nextAction}</small>}
        </li>)}</ul>}
      </section>)}

      <aside className={styles.disclaimer}>이 결과는 사용자가 관찰한 내용을 정리한 것으로 법률·안전·하자 판정이 아니에요. 계약 전 최신 공식 서류와 전문가 확인이 필요할 수 있어요.</aside>
      <div className={styles.resultActions}>
        <button type="button" onClick={onAdd}>다른 집 추가하기</button>
        {canCompare && <button type="button" className={styles.primary} onClick={onCompare}>후보 집 비교하기</button>}
      </div>
      <a className={styles.signupCta} href="/#signup"><strong>집신에 이어서 보관하고 싶나요?</strong><span>현재는 이 기기에만 저장되는 체험판이에요. 집신 가입 안내 보기 →</span></a>
    </main>
  );
}
