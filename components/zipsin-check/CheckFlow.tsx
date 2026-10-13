'use client';
import {useRef,useState} from 'react';
import {getDetailItemsForField,getItemsForDepth} from '@/lib/zipsin-check/catalog';
import {createBrowserPhotoStore,type PhotoStore} from '@/lib/zipsin-check/photo-store';
import {answerItem,containsSensitiveMemo} from '@/lib/zipsin-check/state';
import type {Candidate,CheckAnswer,CheckItem,CheckStatus} from '@/lib/zipsin-check/types';
import MemoPhotoSheet from './MemoPhotoSheet';
import styles from './ZipsinCheck.module.css';

const DEFAULT_STORE=createBrowserPhotoStore();

function Row({item,candidate,onChange,store}:{item:CheckItem;candidate:Candidate;onChange:(value:Candidate)=>void;store:PhotoStore}){
  const answer=candidate.answers[item.id];
  const details=getDetailItemsForField(item.id);
  const[detail,setDetail]=useState(false),[memoOpen,setMemoOpen]=useState(false),[warning,setWarning]=useState('');
  const memoButton=useRef<HTMLButtonElement>(null);
  const updateItem=(target:CheckItem,patch:Partial<CheckAnswer>)=>{const current=candidate.answers[target.id];onChange(answerItem(candidate,target.id,{...current,status:current?.status??'unverified',source:current?.source??'observed',...patch},new Date().toISOString()))};
  const update=(patch:Partial<CheckAnswer>)=>updateItem(item,patch);
  const status=(value:CheckStatus)=>update({status:value});
  const closeMemo=()=>{setMemoOpen(false);requestAnimationFrame(()=>memoButton.current?.focus())};
  return <article className={styles.fieldRow}>
    <div className={styles.fieldQuestion}><span className={styles.requiredStar}>★ 꼭 확인해 주세요</span><h2>{item.title}</h2><p>{item.prompt}</p></div>
    <div className={styles.fieldStatuses}><button type="button" aria-label={`${item.title} 괜찮음`} aria-pressed={answer?.status==='confirmed'} onClick={()=>status('confirmed')}>□ 괜찮음</button><button type="button" aria-label={`${item.title} 다시 확인`} aria-pressed={answer?.status==='caution'} onClick={()=>status('caution')}>□ 다시 확인</button><button type="button" aria-label={`${item.title} 미확인으로 되돌리기`} aria-pressed={!answer||answer.status==='unverified'} onClick={()=>status('unverified')}>↶ 미확인</button></div>
    <div className={styles.rowActions}><button ref={memoButton} type="button" aria-label={`${item.title} ${answer?.memo?'메모·사진 있음':'메모·사진'}`} onClick={()=>setMemoOpen(true)}>{answer?.memo?'메모·사진 있음':'메모·사진'}</button><button type="button" aria-label={`${item.title} 상세 체크 ${detail?'접기':'펼치기'}`} aria-expanded={detail} onClick={()=>setDetail(value=>!value)}>{detail?'상세 접기':'상세 체크'}</button></div>
    {detail&&<section className={styles.actionChecks} aria-label={`${item.title} 상세 체크`}>
      <h3>이것만 추가로 보세요</h3>
      {item.actions?.map(action=><label key={action.id}><input type="checkbox" checked={answer?.actionChecks?.[action.id]??false} onChange={event=>update({actionChecks:{...answer?.actionChecks,[action.id]:event.target.checked}})}/><span>{action.label}</span></label>)}
      {details.map(child=>{const childAnswer=candidate.answers[child.id],action=child.actions?.[0];if(!action)return null;return <div className={styles.detailLine} key={child.id}><strong>{child.title}</strong><label><input type="checkbox" checked={childAnswer?.actionChecks?.[action.id]??false} onChange={event=>updateItem(child,{actionChecks:{...childAnswer?.actionChecks,[action.id]:event.target.checked}})}/><span>{action.label}</span></label></div>})}
      <div className={styles.whyTip}><strong>💡 왜 확인하나요?</strong><p>{item.why}</p></div>
    </section>}
    {warning&&<p role="alert" className={styles.warning}>{warning}</p>}
    {memoOpen&&<MemoPhotoSheet candidateId={candidate.id} itemId={item.id} itemTitle={item.title} initialMemo={answer?.memo} store={store} onClose={closeMemo} onSave={memo=>{if(containsSensitiveMemo(memo)){setWarning('연락처나 출입정보는 저장하지 않았어요.');return}setWarning('');update({memo:memo||undefined});closeMemo()}}/>}
  </article>;
}

export default function CheckFlow({candidate,onChange,onFinish,onBack,photoStore=DEFAULT_STORE}:{candidate:Candidate;onChange:(candidate:Candidate)=>void;onFinish:()=>void;onBack:()=>void;photoStore?:PhotoStore}){
  const items=getItemsForDepth('quick');
  const completed=items.filter(item=>candidate.answers[item.id]?.status!=='unverified'&&candidate.answers[item.id]?.status!==undefined).length;
  return <main className={styles.flow}><header className={styles.fieldHeader}><button type="button" onClick={onBack}>내가 본 집</button><div><h1>{candidate.alias} 체크</h1><span aria-live="polite">✓ {completed}/5 확인 · 자동 저장됨</span></div><span/></header><aside className={styles.fieldGuide}><b>빨간 ★는 꼭 확인해 주세요</b><span>필요하면 메모·사진과 상세 체크도 눌러보세요</span></aside><section className={styles.fieldList} aria-label="현장 필수 5개">{items.map(item=><Row key={item.id} item={item} candidate={candidate} onChange={onChange} store={photoStore}/>)}</section><div className={styles.stickyFinish}><span>{completed}개 체크됨 · 언제든 다시 수정할 수 있어요</span><button type="button" onClick={onFinish}>체크 결과 보기</button></div></main>;
}
