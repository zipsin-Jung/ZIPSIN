'use client';

import type {Candidate, CheckDepth} from '@/lib/zipsin-check/types';
import styles from './ZipsinCheck.module.css';

type Details = {alias: string; locationLabel: string; discoverySource: string; housingType: string; transactionType: string};
type Props = {candidates: Candidate[]; onStart: (depth: CheckDepth, details: Details) => void; onResume: (id: string) => void; onArchive: (id: string) => void; onRestore: (id: string) => void};

export default function CheckStart({candidates, onStart, onResume, onArchive, onRestore}: Props) {
  const active = candidates.filter((candidate) => !candidate.archived);
  const archived = candidates.filter((candidate) => candidate.archived);
  const start = () => onStart('quick', {alias: `오늘 본 집 ${active.length + 1}`, locationLabel: '', discoverySource: '', housingType: '', transactionType: ''});

  return <main className={styles.start}>
    <a className={styles.brand} href="/" aria-label="집신 홈으로">집신 <span>ZIPSIN CHECK</span></a>
    <section className={styles.fieldHero} aria-labelledby="check-start-title">
      <p className={styles.eyebrow}>로그인 없이 바로</p>
      <h1 id="check-start-title">집 보면서 바로 체크하세요.</h1>
      <p>주소나 정보 입력 없이 시작하고, 괜찮은지 확인이 필요한지만 바로 눌러요.</p>
      <button type="button" className={styles.instantStart} disabled={active.length >= 3} onClick={start}>바로 체크 시작</button>
      {active.length >= 3 && <small>후보는 3개까지예요. 기존 집 하나를 비교에서 제외하면 새로 시작할 수 있어요.</small>}
    </section>

    {active.length > 0 && <section className={styles.resume} aria-labelledby="resume-title">
      <h2 id="resume-title">이어서 체크하기</h2>
      {active.map((candidate) => <div className={styles.resumeRow} key={candidate.id}>
        <button type="button" onClick={() => onResume(candidate.id)}><strong>{candidate.alias} 이어서 보기</strong><span>{candidate.depth === 'quick' ? '현장 체크' : '꼼꼼히 보기'}</span></button>
        <button type="button" onClick={() => onArchive(candidate.id)} aria-label={`${candidate.alias} 비교에서 제외`}>제외</button>
      </div>)}
    </section>}

    {archived.length > 0 && <section className={styles.archived} aria-label="비교에서 제외한 집">
      <h2>비교에서 제외한 집</h2>
      {archived.map((candidate) => <button key={candidate.id} type="button" onClick={() => onRestore(candidate.id)} disabled={active.length >= 3}>{candidate.alias} 다시 포함</button>)}
    </section>}

    <aside className={styles.privacy}>체크·메모·사진은 이 브라우저에만 저장되고 외부로 전송되지 않아요. 브라우저 데이터가 지워지면 복구할 수 없어요.</aside>
  </main>;
}
