'use client';

import {useState} from 'react';
import styles from './ZipsinCheck.module.css';

export default function QuickAliasDialog({aliases,onSubmit,onClose}:{aliases:string[];onSubmit:(alias:string)=>void;onClose:()=>void}) {
  const [alias,setAlias]=useState('');
  const [error,setError]=useState('');
  const normalized=alias.trim();
  const duplicate=normalized.length>0&&aliases.some((item)=>item.trim().toLocaleLowerCase('ko-KR')===normalized.toLocaleLowerCase('ko-KR'));
  const submit=()=>{if(!normalized){setError('집 별명을 적어주세요.');return}setError('');onSubmit(normalized)};
  return <div className={styles.sheetBackdrop} role="presentation">
    <section className={`${styles.memoSheet} ${styles.quickAliasSheet}`} role="dialog" aria-modal="true" aria-labelledby="quick-alias-title" onKeyDown={(event)=>{if(event.key==='Escape')onClose()}}>
      <div className={styles.sheetHandle}/>
      <p>바로 기억할 수 있게</p>
      <h2 id="quick-alias-title">이 집 별명 정하기</h2>
      <label>집 별명<input autoFocus maxLength={30} value={alias} placeholder="예: 성수역 5분, 노란문 집" onChange={(event)=>{setAlias(event.target.value);setError('')}}/></label>
      {duplicate&&<small className={styles.aliasNotice}>같은 별명이 있어요. 구분되는 별명을 권장해요.</small>}
      {error&&<small role="alert" className={styles.aliasError}>{error}</small>}
      <div className={styles.sheetActions}><button type="button" onClick={onClose}>닫기</button><button type="button" onClick={submit}>별명 저장하고 체크 시작</button></div>
    </section>
  </div>;
}
