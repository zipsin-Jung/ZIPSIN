'use client';
import {useEffect,useRef,useState} from 'react';
import {getItemsForDepth} from '@/lib/zipsin-check/catalog';
import {answerItem,containsSensitiveMemo,switchDepth} from '@/lib/zipsin-check/state';
import type {Candidate,CheckItem,CheckStatus,EvidenceSource} from '@/lib/zipsin-check/types';
import styles from './ZipsinCheck.module.css';

type Props={candidate:Candidate;onChange:(candidate:Candidate)=>void;onFinish:()=>void;onBack:()=>void};
const STATUSES:{value:CheckStatus;label:string;mark:string}[]=[{value:'confirmed',label:'확인됨',mark:'✓'},{value:'caution',label:'주의',mark:'!'},{value:'unverified',label:'확인 못함',mark:'?'},{value:'expert',label:'전문가 확인',mark:'↗'}];
const SOURCES:{value:EvidenceSource;label:string}[]=[{value:'observed',label:'직접 확인했어요'},{value:'explained',label:'설명을 들었어요'},{value:'document',label:'서류로 확인했어요'},{value:'expert',label:'전문가 확인이 필요해요'}];

function CheckItemCard({item,candidate,onChange}:{item:CheckItem;candidate:Candidate;onChange:(candidate:Candidate)=>void}){
  const saved=candidate.answers[item.id];
  const [expanded,setExpanded]=useState(false);
  const [memo,setMemo]=useState(saved?.memo??'');
  const [warning,setWarning]=useState('');
  const source=saved?.source??'observed';
  function update(status:CheckStatus,nextSource:EvidenceSource=source){
    if(containsSensitiveMemo(memo)){setWarning('출입정보나 연락처처럼 민감할 수 있는 내용은 저장하지 않았어요. 안전한 관찰 내용만 적어 주세요.');return;}
    setWarning('');
    onChange(answerItem(candidate,item.id,{status,source:nextSource,...(memo.trim()?{memo:memo.trim()}:{})},new Date().toISOString()));
  }
  return <article className={styles.itemCard} aria-labelledby={`item-${item.id}`}>
    <div className={styles.itemTop}><span>{item.group}{item.core?' · 핵심':' · 추가'}</span><button type="button" aria-expanded={expanded} aria-controls={`detail-${item.id}`} onClick={()=>setExpanded(value=>!value)}>왜 확인하나요?</button></div>
    <h2 id={`item-${item.id}`}>{item.title}</h2><p>{item.prompt}</p>
    <div className={styles.compactStatuses} aria-label={`${item.title} 상태`}>{STATUSES.map(option=><button key={option.value} type="button" aria-label={`${item.title} ${option.label}`} aria-pressed={saved?.status===option.value} onClick={()=>update(option.value)}><b aria-hidden="true">{option.mark}</b><span>{option.label}</span></button>)}</div>
    {expanded&&<section id={`detail-${item.id}`} className={styles.itemDetail}>
      <div className={styles.explanation}><div><strong>왜</strong><p>{item.why}</p></div><div><strong>어떻게</strong><p>{item.how}</p></div><div><strong>물어볼 말</strong><p>“{item.question}”</p></div></div>
      <fieldset className={styles.sources}><legend>확인한 근거</legend>{SOURCES.map(option=><label key={option.value}><input type="radio" name={`source-${item.id}`} value={option.value} checked={source===option.value} onChange={()=>saved?.status&&update(saved.status,option.value)}/><span>{option.label}</span></label>)}</fieldset>
      <div className={styles.memo}><label htmlFor={`memo-${item.id}`}>선택 메모</label><textarea id={`memo-${item.id}`} value={memo} onChange={event=>setMemo(event.target.value)} onBlur={()=>saved?.status&&update(saved.status)} placeholder="예: 창가 오른쪽에 작은 얼룩" maxLength={300}/><small>출입 비밀번호와 연락처는 적지 마세요.</small>{warning&&<p role="alert" className={styles.warning}>{warning}</p>}</div>
    </section>}
    {!expanded&&warning&&<p role="alert" className={styles.warning}>{warning}</p>}
  </article>;
}

export default function CheckFlow({candidate,onChange,onFinish,onBack}:Props){
  const items=getItemsForDepth(candidate.depth);
  const headingRef=useRef<HTMLHeadingElement>(null);
  useEffect(()=>{headingRef.current?.focus();},[candidate.depth]);
  const completed=items.filter(item=>candidate.answers[item.id]).length;
  return <main className={styles.flow}>
    <header className={styles.overviewHeader}><button type="button" onClick={onBack}>← 나가기</button><div><p>{candidate.locationLabel||candidate.alias}</p><h1 ref={headingRef} tabIndex={-1}>{candidate.alias} 체크리스트</h1><span>{completed}/{items.length}개 확인 · 한 화면에서 바로 체크하세요</span></div><button type="button" onClick={()=>onChange(switchDepth(candidate,candidate.depth==='quick'?'thorough':'quick',new Date().toISOString()))}>{candidate.depth==='quick'?'더 꼼꼼히 보기':'빠르게만 보기'}</button></header>
    <div className={styles.checkMeta}>{candidate.discoverySource&&<span>{candidate.discoverySource}</span>}{candidate.housingType&&<span>{candidate.housingType}</span>}{candidate.transactionType&&<span>{candidate.transactionType}</span>}</div>
    <section className={styles.itemGrid} aria-label={`${candidate.depth==='quick'?'빠른':'꼼꼼한'} 체크 항목`}>{items.map(item=><CheckItemCard key={item.id} item={item} candidate={candidate} onChange={onChange}/>)}</section>
    <div className={styles.stickyFinish}><span>{completed}개 확인 · 나머지는 미확인으로 정리돼요</span><button type="button" onClick={onFinish}>체크 결과 정리하기</button></div>
  </main>;
}
