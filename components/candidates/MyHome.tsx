import {ArrowLeftRight,ChevronRight,Cloud,KeyRound,MapPin,Plus} from 'lucide-react';
import type {CandidateDraftSummary} from '@/features/candidates/server/service';
import styles from './Candidates.module.css';

const dateLabel=(iso:string)=>{const d=new Date(iso);return Number.isNaN(d.getTime())?'':`${d.getMonth()+1}월 ${d.getDate()}일`};

/** 집신 계정에 저장한 집 목록과 다음 단계. 저장 직후(saved)에는 완료 알림을 띄운다. */
export default function MyHome({candidates,saved}:{candidates:CandidateDraftSummary[];saved:boolean}){
  return <div className={styles.myHome}>
    {saved&&<p className={styles.toast} role="status">✓ 집신에 저장했어요</p>}
    <header className={styles.myHomeTop}><a href="/ck" className={styles.back}>‹ 집신체크</a><div className={styles.brand}><span aria-hidden="true">⌂</span><div><h1>마이 홈</h1><small>ZIPSIN CHECK</small></div></div></header>
    {candidates.length===0?<section className={styles.empty}><h2>저장한 집이 아직 없어요.</h2><p>집신체크에서 체크한 집을 집신에 저장하면 여기에 모여요.</p><a className={styles.primaryLink} href="/ck">집신 체크 시작</a></section>:<>
    <p className={styles.doneBanner}><Cloud aria-hidden="true"/><span><b>집신에 안전하게 보관 중</b><small>다른 휴대폰·PC에서 로그인하면 그대로 보여요</small></span></p>
    <h2 className={styles.count}>저장한 집 {candidates.length}채</h2>
    <div className={styles.grid}>{candidates.map(candidate=>{const s=candidate.summary;const location=typeof candidate.listing.location==='string'&&candidate.listing.location?candidate.listing.location:'위치 미입력';return <a className={styles.card} href={`/my/candidates/${candidate.id}`} key={candidate.id}>
      <span className={styles.cardTop}><h3>{candidate.alias}</h3><em>☁ 저장됨</em></span>
      <span className={styles.meta}><MapPin aria-hidden="true"/><span>{location}</span>{dateLabel(candidate.createdAt)&&<span>· {dateLabel(candidate.createdAt)}</span>}</span>
      <span className={styles.meter} aria-hidden="true"><i style={{width:`${Math.round(s.checked/s.checkTotal*100)}%`}}/></span>
      <span className={styles.stats}>
        <span><b>{s.checked}/{s.checkTotal}</b>집 체크</span>
        <span className={s.problems?styles.warn:undefined}><b aria-label={`문제 ${s.problems}개`}>{s.problems}</b>문제</span>
        <span><b>{s.asked}/{s.askTotal}</b>질문</span>
        <span><b aria-label={`사진 ${candidate.photoCount}장`}>{candidate.photoCount}</b>사진</span>
      </span>
    </a>})}</div>
    <section className={styles.nextSteps} aria-labelledby="my-next-title"><h2 id="my-next-title">다음 단계</h2>
      {candidates.length>=2&&<a href="/ck"><span><ArrowLeftRight aria-hidden="true"/></span><b>{candidates.length}채 비교하고 고르기<small>집신체크에서 문제·비용·질문 답을 나란히</small></b><ChevronRight aria-hidden="true"/></a>}
      <a href="/ck"><span><Plus aria-hidden="true"/></span><b>다른 집 체크하기<small>집신체크로 돌아가기</small></b><ChevronRight aria-hidden="true"/></a>
      <div className={styles.soon} aria-disabled="true"><span><KeyRound aria-hidden="true"/></span><b>계약하면 집신에서 이어서 관리<small>준비 중</small></b></div>
    </section></>}
  </div>;
}
