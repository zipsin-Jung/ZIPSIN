'use client';

import {useEffect,useState} from 'react';
import {LEGACY_ITEM_IDS_BY_FIELD} from '@/lib/zipsin-check/catalog';
import {photoRecordId,preparePhoto,type PhotoStore,type StoredPhoto} from '@/lib/zipsin-check/photo-store';
import styles from './ZipsinCheck.module.css';

type Props={candidateId:string;itemId:string;itemTitle:string;store:PhotoStore;onMutation?:()=>void;onBusyChange?:(busy:boolean)=>void};

export default function PhotoField({candidateId,itemId,itemTitle,store,onMutation,onBusyChange}:Props){
  const[photos,setPhotos]=useState<StoredPhoto[]>([]),[previews,setPreviews]=useState<string[]>([]),[message,setMessage]=useState(''),[saving,setSaving]=useState(false);
  const itemIds=[itemId,...(LEGACY_ITEM_IDS_BY_FIELD[itemId as keyof typeof LEGACY_ITEM_IDS_BY_FIELD]??[])];
  useEffect(()=>{let active=true;Promise.all(itemIds.map(id=>store.get(candidateId,id))).then(saved=>{if(active)setPhotos(saved.filter((photo):photo is StoredPhoto=>!!photo))}).catch(()=>undefined);return()=>{active=false}},[candidateId,itemId,store]);
  useEffect(()=>{const urls=photos.map(photo=>URL.createObjectURL(photo.blob));setPreviews(urls);return()=>urls.forEach(url=>URL.revokeObjectURL(url))},[photos]);
  const busy=(value:boolean)=>{setSaving(value);onBusyChange?.(value)};
  async function select(file?:File){if(!file)return;busy(true);setMessage('사진을 안전하게 처리하는 중이에요.');try{const blob=await preparePhoto(file),next:StoredPhoto={id:photoRecordId(candidateId,itemId),candidateId,itemId,blob,mime:blob.type,bytes:blob.size,createdAt:new Date().toISOString()};await store.put(next);setPhotos(current=>[next,...current.filter(photo=>photo.itemId!==itemId)]);onMutation?.();setMessage('이 기기에 사진을 저장했어요.')}catch(error){setMessage(error instanceof Error?error.message:'사진을 저장하지 못했어요.')}finally{busy(false)}}
  async function remove(photo:StoredPhoto){if(!window.confirm(`${itemTitle} 사진을 이 기기에서 삭제할까요? 삭제한 사진은 복구할 수 없어요.`))return;busy(true);try{await store.remove(candidateId,photo.itemId);setPhotos(current=>current.filter(saved=>saved.id!==photo.id));onMutation?.();setMessage('사진을 삭제했어요.')}catch(error){setMessage(error instanceof Error?error.message:'사진을 삭제하지 못했어요.')}finally{busy(false)}}
  return <div className={styles.photoField}><input id={`photo-${candidateId}-${itemId}`} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" aria-label={`${itemTitle} 사진 추가`} disabled={saving} onChange={event=>{void select(event.target.files?.[0]);event.currentTarget.value=''}}/><label htmlFor={`photo-${candidateId}-${itemId}`}>{photos.some(photo=>photo.itemId===itemId)?'사진 바꾸기':'사진 추가'}</label>{photos.map((photo,index)=>{const label=photos.length===1?`${itemTitle} 현장 사진`:`${itemTitle} 현장 사진 ${index+1}`;return <span key={photo.id}><a href={previews[index]} target="_blank" rel="noreferrer" aria-label={`${label} 크게 보기`}><img src={previews[index]} alt={label}/></a><button type="button" aria-label={photos.length===1?`${itemTitle} 사진 제거`:`${itemTitle} 사진 ${index+1} 제거`} disabled={saving} onClick={()=>void remove(photo)}>사진 제거</button></span>})}{message&&<small role={message.includes('저장했어요')||message.includes('삭제했어요')?'status':'alert'}>{message}</small>}</div>;
}
