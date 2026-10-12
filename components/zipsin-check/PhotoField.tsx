'use client';

import {useEffect, useState} from 'react';
import {photoRecordId, preparePhoto, type PhotoStore, type StoredPhoto} from '@/lib/zipsin-check/photo-store';
import styles from './ZipsinCheck.module.css';

type Props = {candidateId: string; itemId: string; itemTitle: string; store: PhotoStore};

export default function PhotoField({candidateId, itemId, itemTitle, store}: Props) {
  const [photo, setPhoto] = useState<StoredPhoto>();
  const [preview, setPreview] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    store.get(candidateId, itemId).then((saved) => { if (active) setPhoto(saved); }).catch(() => undefined);
    return () => { active = false; };
  }, [candidateId, itemId, store]);

  useEffect(() => {
    if (!photo) { setPreview(''); return; }
    const url = URL.createObjectURL(photo.blob);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  async function select(file?: File) {
    if (!file) return;
    setSaving(true);
    setMessage('사진을 안전하게 처리하는 중이에요.');
    try {
      const blob = await preparePhoto(file);
      const next: StoredPhoto = {id: photoRecordId(candidateId, itemId), candidateId, itemId, blob, mime: blob.type, bytes: blob.size, createdAt: new Date().toISOString()};
      await store.put(next);
      setPhoto(next);
      setMessage('이 기기에 사진을 저장했어요.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '사진을 저장하지 못했어요.');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm(`${itemTitle} 사진을 이 기기에서 삭제할까요? 삭제한 사진은 복구할 수 없어요.`)) return;
    setSaving(true);
    try {
      await store.remove(candidateId, itemId);
      setPhoto(undefined);
      setMessage('사진을 삭제했어요.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '사진을 삭제하지 못했어요.');
    } finally {
      setSaving(false);
    }
  }

  return <div className={styles.photoField}>
    <input id={`photo-${candidateId}-${itemId}`} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" aria-label={`${itemTitle} 사진 추가`} disabled={saving} onChange={(event) => { void select(event.target.files?.[0]); event.currentTarget.value = ''; }}/>
    <label htmlFor={`photo-${candidateId}-${itemId}`}>{photo ? '사진 바꾸기' : '사진 추가'}</label>
    {photo && <button type="button" aria-label={`${itemTitle} 사진 제거`} disabled={saving} onClick={() => { void remove(); }}>사진 제거</button>}
    {preview && <img src={preview} alt={`${itemTitle} 현장 사진`} />}
    {message && <small role={message.includes('저장했어요') || message.includes('삭제했어요') ? 'status' : 'alert'}>{message}</small>}
  </div>;
}
