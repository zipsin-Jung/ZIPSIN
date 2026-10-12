'use client';

import {useState} from 'react';
import type {Candidate, CheckDepth} from '@/lib/zipsin-check/types';
import styles from './ZipsinCheck.module.css';

type Props = {
  candidates: Candidate[];
  onStart: (depth: CheckDepth, details: {alias: string; locationLabel: string; discoverySource: string; housingType: string; transactionType: string}) => void;
  onResume: (id: string) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
};

export default function CheckStart({candidates, onStart, onResume, onArchive, onRestore}: Props) {
  const [alias, setAlias] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [discoverySource, setDiscoverySource] = useState('부동산 중개사무소');
  const [housingType, setHousingType] = useState('원룸·오피스텔');
  const [transactionType, setTransactionType] = useState('월세');
  const active = candidates.filter((candidate) => !candidate.archived);
  const archived = candidates.filter((candidate) => candidate.archived);

  return (
    <main className={styles.start}>
      <a className={styles.brand} href="/" aria-label="집신 홈으로">집신 <span>ZIPSIN CHECK</span></a>
      <section className={styles.hero} aria-labelledby="check-start-title">
        <p className={styles.eyebrow}>로그인 없이 바로 쓰는 집 보기 체크</p>
        <h1 id="check-start-title">설레는 집 보기,<br/>빠뜨리지 말고 확인해요.</h1>
        <p>집 정보를 한 번만 적고, 필요한 항목을 한 화면에서 편하게 체크하세요.</p>
      </section>

      {active.length > 0 && (
        <section className={styles.resume} aria-labelledby="resume-title">
          <h2 id="resume-title">이어서 확인할 집</h2>
          {active.map((candidate) => <div className={styles.resumeRow} key={candidate.id}>
            <button type="button" onClick={() => onResume(candidate.id)}><strong>{candidate.alias} 이어서 보기</strong><span>{candidate.depth === 'quick' ? '빠르게 체크' : '꼼꼼하게 체크'}</span></button>
            <button type="button" onClick={() => onArchive(candidate.id)} aria-label={`${candidate.alias} 비교에서 제외`}>제외</button>
          </div>)}
        </section>
      )}

      {archived.length > 0 && <section className={styles.archived} aria-label="비교에서 제외한 집">
        <h2>비교에서 제외한 집</h2>
        {archived.map((candidate) => <button key={candidate.id} type="button" onClick={() => onRestore(candidate.id)} disabled={active.length >= 3}>{candidate.alias} 다시 포함</button>)}
      </section>}

      <div className={styles.field}>
        <label htmlFor="candidate-alias">후보 별칭</label>
        <input id="candidate-alias" value={alias} onChange={(event) => setAlias(event.target.value)} maxLength={30} placeholder="예: 햇살 좋은 집 (선택)"/>
        <small>비교 화면에 표시할 짧은 이름이에요.</small>
      </div>
      <div className={styles.intakeGrid}>
        <div className={styles.field}><label htmlFor="location-label">동네 또는 건물 별칭</label><input id="location-label" value={locationLabel} onChange={(event) => setLocationLabel(event.target.value)} maxLength={50} placeholder="예: 성수동 햇살빌라 (선택)"/><small>상세 주소는 적지 마세요. 현재 기기에만 저장돼요.</small></div>
        <div className={styles.field}><label htmlFor="discovery-source">이 집을 어떻게 알게 됐나요?</label><select id="discovery-source" value={discoverySource} onChange={(event) => setDiscoverySource(event.target.value)}><option>부동산 중개사무소</option><option>부동산 앱·사이트</option><option>지인 소개</option><option>현수막·거리 광고</option><option>직접 찾음</option><option>기타</option></select></div>
        <div className={styles.field}><label htmlFor="housing-type">주택 유형</label><select id="housing-type" value={housingType} onChange={(event) => setHousingType(event.target.value)}><option>원룸·오피스텔</option><option>빌라·다세대</option><option>아파트</option><option>단독·다가구</option><option>기타</option></select></div>
        <div className={styles.field}><label htmlFor="transaction-type">거래 유형</label><select id="transaction-type" value={transactionType} onChange={(event) => setTransactionType(event.target.value)}><option>월세</option><option>전세</option><option>매매</option><option>아직 모름</option></select></div>
      </div>

      <section className={styles.depthGrid} aria-label="체크 방식 선택">
        <button type="button" className={styles.depthCard} disabled={active.length >= 3} onClick={() => onStart('quick', {alias, locationLabel, discoverySource, housingType, transactionType})} aria-label={`${alias ? `${alias} ` : '별칭 없이 '}빠르게 체크 시작, 3~5분`}>
          <span className={styles.time}>3~5분 · 핵심 9개</span>
          <strong>빠르게 체크</strong>
          <span>꼭 봐야 할 것만 현장에서 확인해요.</span>
        </button>
        <button type="button" className={`${styles.depthCard} ${styles.deep}`} disabled={active.length >= 3} onClick={() => onStart('thorough', {alias, locationLabel, discoverySource, housingType, transactionType})} aria-label={`${alias ? `${alias} ` : '별칭 없이 '}꼼꼼하게 체크 시작, 10~15분`}>
          <span className={styles.time}>10~15분 · 공간별 추가</span>
          <strong>꼼꼼하게 체크</strong>
          <span>방·욕실·주방·계약까지 놓치지 않아요.</span>
        </button>
      </section>
      {active.length >= 3 && <p className={styles.limit}>후보는 3개까지 비교할 수 있어요. 한 집을 비교에서 제외하면 새로 추가할 수 있어요.</p>}

      <aside className={styles.privacy}>입력 내용은 현재 기기에 저장돼요. 공용 기기에서는 다른 사람이 볼 수 있으니 상세 주소·동호수·출입 비밀번호·연락처는 적지 마세요.</aside>
    </main>
  );
}
