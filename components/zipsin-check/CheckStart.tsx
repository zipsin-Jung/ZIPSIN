'use client';

import {useState} from 'react';
import type {Candidate, CheckDepth} from '@/lib/zipsin-check/types';
import styles from './ZipsinCheck.module.css';

type Props = {
  candidates: Candidate[];
  onStart: (depth: CheckDepth, alias: string) => void;
  onResume: (id: string) => void;
};

export default function CheckStart({candidates, onStart, onResume}: Props) {
  const [alias, setAlias] = useState('');
  const active = candidates.filter((candidate) => !candidate.archived);

  return (
    <main className={styles.start}>
      <a className={styles.brand} href="/" aria-label="집신 홈으로">집신 <span>ZIPSIN CHECK</span></a>
      <section className={styles.hero} aria-labelledby="check-start-title">
        <p className={styles.eyebrow}>집을 보기 전부터 계약 질문까지</p>
        <h1 id="check-start-title">시간에 맞게 확인해 보세요.</h1>
        <p>같은 기준으로 확인하되, 필요한 만큼만 자세히 볼 수 있어요.</p>
      </section>

      {active.length > 0 && (
        <section className={styles.resume} aria-labelledby="resume-title">
          <h2 id="resume-title">이어서 확인할 집</h2>
          {active.map((candidate) => (
            <button key={candidate.id} type="button" onClick={() => onResume(candidate.id)}>
              <strong>{candidate.alias} 이어서 보기</strong>
              <span>{candidate.depth === 'quick' ? '빠르게 체크' : '꼼꼼하게 체크'}</span>
            </button>
          ))}
        </section>
      )}

      <div className={styles.field}>
        <label htmlFor="candidate-alias">후보 별칭</label>
        <input id="candidate-alias" value={alias} onChange={(event) => setAlias(event.target.value)} maxLength={30} placeholder="예: 햇살 좋은 집 (선택)"/>
        <small>정확한 주소 대신 나만 알아볼 별칭을 권해요.</small>
      </div>

      <section className={styles.depthGrid} aria-label="체크 방식 선택">
        <button type="button" className={styles.depthCard} onClick={() => onStart('quick', alias)} aria-label={`${alias ? `${alias} ` : '별칭 없이 '}빠르게 체크 시작, 3~5분`}>
          <span className={styles.time}>3~5분 · 핵심 9개</span>
          <strong>빠르게 체크</strong>
          <span>꼭 봐야 할 것만 현장에서 확인해요.</span>
        </button>
        <button type="button" className={`${styles.depthCard} ${styles.deep}`} onClick={() => onStart('thorough', alias)} aria-label={`${alias ? `${alias} ` : '별칭 없이 '}꼼꼼하게 체크 시작, 10~15분`}>
          <span className={styles.time}>10~15분 · 공간별 추가</span>
          <strong>꼼꼼하게 체크</strong>
          <span>방·욕실·주방·계약까지 놓치지 않아요.</span>
        </button>
      </section>

      <aside className={styles.privacy}>이 기기에만 임시 저장돼요. 공용 기기에서는 다른 사람이 볼 수 있어요. 정확 주소·비밀번호·연락처는 적지 마세요.</aside>
    </main>
  );
}
