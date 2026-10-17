'use client';
import {useEffect, useRef} from 'react';
import {Check, MapPin, MessageSquareText, Search, TriangleAlert} from 'lucide-react';
import {ASK_ITEMS, CHECK_ITEMS} from '@/lib/zipsin-check/catalog';
import {formatRentalPrice, formatWon} from '@/lib/zipsin-check/format';
import type {CandidateV2} from '@/lib/zipsin-check/types';
import styles from './ZipsinCheck.module.css';
import {isAccountOpen} from '@/lib/site/account-launch';

/** 확정 요약에 넣을 내용만 뽑습니다. 점수·순위 없이 사용자가 직접 남긴 사실만 씁니다. */
export function buildDecision(candidate: CandidateV2) {
  const good = CHECK_ITEMS.filter(item => candidate.answers[item.id]?.status === 'confirmed').map(item => item.title);
  const recheck = CHECK_ITEMS.filter(item => candidate.answers[item.id]?.status === 'caution').map(item => item.title);
  const notes = [...CHECK_ITEMS, ...ASK_ITEMS].flatMap(item => {
    const memo = candidate.answers[item.id]?.memo?.trim();
    return memo ? [{title: item.title, memo}] : [];
  });
  const terms = [
    candidate.terms.depositWon !== undefined || candidate.terms.monthlyRentWon !== undefined ? `보증금·월세 ${formatRentalPrice(candidate.terms.depositWon, candidate.terms.monthlyRentWon)}` : '',
    candidate.terms.maintenanceFeeWon !== undefined ? `관리비 ${formatWon(candidate.terms.maintenanceFeeWon)}` : '',
    candidate.terms.moveInDate ? `입주 ${candidate.terms.moveInDate}` : '',
    candidate.commute.minutes !== undefined ? `출퇴근 ${candidate.commute.minutes}분` : '',
  ].filter(Boolean);
  return {good, recheck, notes, terms};
}

export default function DecideSummary({candidate, onBack, onStart}: {candidate: CandidateV2; onBack: () => void; onStart: () => boolean}) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { titleRef.current?.focus(); }, []);
  const {good, recheck, notes, terms} = buildDecision(candidate);
  const href = `/ck/transfer?candidates=${encodeURIComponent(candidate.id)}`;

  return <main className={styles.decide}>
    <button type="button" className={styles.back} onClick={onBack}>← 다른 집 더 보기</button>
    <header className={styles.decideHead}>
      <p>이 집으로 확정</p>
      <h1 ref={titleRef} tabIndex={-1}>{candidate.alias}</h1>
      <span><MapPin aria-hidden="true"/>{candidate.listing.location || '위치 미입력'}</span>
    </header>

    <div className={styles.decideGrid}>
      <section aria-labelledby="decide-source"><h2 id="decide-source"><Search aria-hidden="true"/>처음 본 곳</h2>
        <p className={styles.decideBig}>{candidate.listing.discoverySource || '기록하지 않았어요'}</p>
        {terms.length ? <ul className={styles.decideTags}>{terms.map(term => <li key={term}>{term}</li>)}</ul> : null}
      </section>

      <section aria-labelledby="decide-good"><h2 id="decide-good"><Check aria-hidden="true"/>좋았던 점 {good.length}개</h2>
        {good.length ? <ul className={styles.decideTags}>{good.map(title => <li key={title} data-tone="good">{title} 문제없음</li>)}</ul> : <p className={styles.decideEmpty}>&apos;문제없음&apos;으로 체크한 항목이 아직 없어요.</p>}
      </section>

      <section aria-labelledby="decide-notes"><h2 id="decide-notes"><MessageSquareText aria-hidden="true"/>내가 남긴 메모</h2>
        {notes.length ? <ul className={styles.decideNotes}>{notes.slice(0, 5).map(note => <li key={note.title}><b>{note.title}</b>{note.memo}</li>)}</ul> : <p className={styles.decideEmpty}>남긴 메모가 없어요.</p>}
      </section>

      {recheck.length ? <section aria-labelledby="decide-recheck" className={styles.decideWarn}><h2 id="decide-recheck"><TriangleAlert aria-hidden="true"/>계약 전에 한 번 더</h2>
        <ul className={styles.decideTags}>{recheck.map(title => <li key={title} data-tone="warn">{title}</li>)}</ul>
      </section> : null}
    </div>

    <div className={styles.decideActions}>
      {isAccountOpen()
        ? <><a className={styles.instantStart} href={href} onClick={event => { if (!onStart()) event.preventDefault(); }}>집신 시작</a>
          <p>집신에 이 집을 저장하고, 계약·입주 뒤 기록도 이어서 관리해요. 처음이면 1분 회원가입이 필요해요.</p></>
        : <><button type="button" className={styles.instantStart} disabled>집신 시작 · 준비 중</button>
          <p>집신 연결은 곧 열려요. 이 집 기록은 이 휴대폰에 그대로 남아 있어요.</p></>}
    </div>
  </main>;
}
