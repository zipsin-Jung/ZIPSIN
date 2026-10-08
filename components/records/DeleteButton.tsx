'use client';
import {useRef, useState, useTransition} from 'react';
import {deleteRepairAction} from '@/app/records/actions';
export default function DeleteButton({id}:{id:string}) {
  const [open,setOpen]=useState(false); const [error,setError]=useState(''); const [pending,start]=useTransition(); const triggerRef=useRef<HTMLButtonElement>(null);
  const close=()=>{setOpen(false); requestAnimationFrame(()=>triggerRef.current?.focus());};
  return <><button ref={triggerRef} className="records-danger-link" type="button" onClick={()=>setOpen(true)}>기록 삭제</button>{open&&<div className="records-dialog-backdrop" role="presentation" onKeyDown={(event)=>{if(event.key==='Escape'&&!pending)close();}}><div className="records-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-title"><h2 id="delete-title">이 기록을 삭제할까요?</h2><p>삭제한 기록은 이 화면에서 복구할 수 없습니다.</p>{error&&<p role="alert" className="records-error">{error}</p>}<div className="records-actions"><button autoFocus className="records-secondary" onClick={close} disabled={pending}>취소</button><button className="records-danger" disabled={pending} onClick={()=>start(async()=>{const result=await deleteRepairAction(id); if(result?.error)setError(result.error);})}>{pending?'삭제 중…':'삭제 확인'}</button></div></div></div>}</>;
}
