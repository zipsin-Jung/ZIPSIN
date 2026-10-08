'use client';
import {useFormStatus} from 'react-dom';
export default function SubmitButton({editing = false}: {editing?: boolean}) {
  const {pending} = useFormStatus();
  return <button className="records-primary" type="submit" disabled={pending} aria-disabled={pending}>{pending ? '저장 중…' : editing ? '변경 내용 저장' : '수리 기록 등록'}</button>;
}
