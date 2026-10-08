'use client';
import Link from 'next/link';
import {useActionState, useEffect, useRef, useState} from 'react';
import type {RepairActionState, RepairRecord} from '@/lib/repairs/types';
import {categoryLabels, repairCategories, repairStatuses, statusLabels} from '@/lib/repairs/types';
import SubmitButton from './SubmitButton';

type Action = (state: RepairActionState, data: FormData) => Promise<RepairActionState>;
export default function RepairForm({action, record}: {action: Action; record?: RepairRecord}) {
  const [state, formAction] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState(record?.image_url ?? '');
  const [removeImage, setRemoveImage] = useState(false);
  useEffect(() => {
    const first = Object.keys(state.errors ?? {})[0];
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  }, [state]);
  const value = (name: string, fallback = '') => state.values?.[name] ?? fallback;
  const error = (name: string) => state.errors?.[name];
  return <form ref={formRef} action={formAction} className="records-form" noValidate>
    <div className="records-warning"><strong>미션용 가상 기록</strong><span>실제 주소·이름·전화번호·계약서는 입력하지 마세요.</span></div>
    {state.message && <p className="records-alert" role="alert">{state.message}</p>}
    <div className="records-form-grid">
      <Field label="수리 제목" name="title" error={error('title')}><input id="title" name="title" defaultValue={value('title', record?.title)} maxLength={80} required aria-describedby="title-error" placeholder="예: 욕실 천장 누수"/></Field>
      <Field label="집 별칭" name="homeAlias" error={error('homeAlias')} hint="실제 주소 대신 가상 별칭을 써 주세요."><input id="homeAlias" name="homeAlias" defaultValue={value('homeAlias', record?.home_alias)} maxLength={40} required aria-describedby="homeAlias-hint homeAlias-error" placeholder="예: 테스트 주택 A"/></Field>
      <Field label="수리 종류" name="category" error={error('category')}><select id="category" name="category" defaultValue={value('category', record?.category ?? '')} required><option value="">선택해 주세요</option>{repairCategories.map((item) => <option key={item} value={item}>{categoryLabels[item]}</option>)}</select></Field>
      <Field label="진행 상태" name="status" error={error('status')}><select id="status" name="status" defaultValue={value('status', record?.status ?? 'received')} required>{repairStatuses.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}</select></Field>
      <Field label="수리일" name="repairDate" error={error('repairDate')}><input id="repairDate" type="date" name="repairDate" defaultValue={value('repairDate', record?.repair_date)} required/></Field>
      <Field label="사진 1장 (선택)" name="image" error={error('image')} hint="JPG·PNG·WebP, 최대 5MB"><input id="image" type="file" name="image" accept="image/jpeg,image/png,image/webp" onChange={(event) => {const file=event.target.files?.[0]; if(file){const url=URL.createObjectURL(file); setPreview(url); setRemoveImage(false);}}}/></Field>
      <Field label="수리 내용" name="description" error={error('description')} full><textarea id="description" name="description" defaultValue={value('description', record?.description)} minLength={10} maxLength={1000} rows={7} required placeholder="문제와 처리 내용을 10자 이상 써 주세요."/></Field>
    </div>
    {(preview || record?.image_path) && <div className="records-preview">{preview && !removeImage && <img src={preview} alt="선택한 수리 사진 미리보기"/>}<label><input type="checkbox" name="removeImage" value="true" checked={removeImage} onChange={(event) => setRemoveImage(event.target.checked)}/> 저장할 때 이미지 삭제</label></div>}
    <div className="records-actions"><SubmitButton editing={Boolean(record)}/><Link href={record ? `/records/${record.id}` : '/records'} className="records-secondary">취소</Link></div>
  </form>;
}

function Field({label,name,error,hint,full,children}:{label:string;name:string;error?:string;hint?:string;full?:boolean;children:React.ReactNode}) {
  return <div className={`records-field${full?' records-field-full':''}`}><label htmlFor={name}>{label}</label>{<span className="records-control">{children}</span>}{hint&&<small id={`${name}-hint`}>{hint}</small>}{error&&<small id={`${name}-error`} className="records-error" role="alert">{error}</small>}</div>;
}
