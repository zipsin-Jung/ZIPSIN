'use client';
import type {CandidateV2} from '@/lib/zipsin-check/types';
import styles from './ZipsinCheck.module.css';

const HOW_TO=[['01','미리 읽기','집에 가기 전 체크 항목을 훑어보세요.'],['02','네모만 체크','현장에서는 괜찮음·다시 확인만 누르세요.'],['03','사진·메모','급하면 기억할 것만 바로 남겨요.'],['04','카드처럼 비교','나온 뒤 2~3채를 같은 기준으로 보세요.']];
const PREVIEW=['물·배수','곰팡이·누수','채광·소음','창문·문','옵션·파손'];

export default function CheckStart({candidates,onNew,onInstant,onResume,onDelete}:{candidates:CandidateV2[];onNew:()=>void;onInstant:()=>void;onResume:(id:string)=>void;onDelete:(id:string)=>void}){
  return <main className={styles.start}>
    <a className={styles.brand} href="/" aria-label="집신 홈으로"><img src="/images/zipsin-company-logo.jpg" alt="집신 로고"/><span><b>집신</b><small>ZIPSIN CHECK</small></span></a>
    <section className={styles.fieldHero}><div className={styles.heroMascot} role="img" aria-label="집신이 캐릭터"/><div><p className={styles.eyebrow}>로그인 없이 바로</p><h1>내가 본 집,<br/><em>카드처럼 비교해요.</em></h1><p>집 안에서는 빠르게 체크하고, 나온 뒤에는 같은 기준으로 차분히 비교해요.</p><div className={styles.startActions}><button type="button" className={styles.instantStart} onClick={onInstant}>바로 체크</button><button type="button" className={styles.registerButton} onClick={onNew}>집 정보부터 등록</button></div></div></section>
    <section className={styles.howTo}><p className={styles.sectionKicker}>HOW TO</p><h2>이렇게 쓰면 돼요</h2><div>{HOW_TO.map(([number,title,copy])=><article key={number}><span>{number}</span><strong>{title}</strong><p>{copy}</p></article>)}</div></section>
    <aside className={styles.tipBanner}><div className={styles.tipMascot} role="img" aria-label="안내하는 집신이 캐릭터"/><div><b>💡 현장 꿀팁</b><p>미리 읽어보고 가면 좋아요</p><p>급할 땐 사진이나 메모만 남겨요</p><small><b>★</b> 빨간 별은 꼭 확인해 주세요.</small></div></aside>
    <section className={styles.checkPreview}><div><p className={styles.sectionKicker}>CHECK PREVIEW</p><h2>이런 것을 확인해요</h2></div><ul>{PREVIEW.map(item=><li key={item}><span>□</span><b>{item}</b><small>★ 필수</small></li>)}</ul></section>
    {candidates.length>0&&<section className={styles.resume}><h2>내가 본 집 {candidates.length}채</h2>{candidates.map(candidate=><div className={styles.resumeRow} key={candidate.id}><button type="button" onClick={()=>onResume(candidate.id)}><strong>{candidate.alias}</strong><span>{candidate.listing.location||'위치 미입력'}</span></button><button type="button" aria-label={`${candidate.alias} 영구 삭제`} onClick={()=>onDelete(candidate.id)}>삭제</button></div>)}</section>}
    <aside className={styles.privacy}>체크·메모·사진은 이 브라우저에만 저장되고 외부로 전송되지 않아요.</aside>
  </main>;
}
