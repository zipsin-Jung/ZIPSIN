import {CHECK_ITEMS} from '@/lib/zipsin-check/catalog';
import type {PhotoStore} from '@/lib/zipsin-check/photo-store';
import {containsSensitiveMemo} from '@/lib/zipsin-check/state';
import type {StoredCheckStateV2} from '@/lib/zipsin-check/types';
import {allowedPhotoMimes,MAX_TRANSFER_PHOTO_BYTES,requestKeySchema,transferTextSchema} from './schema';
import {validateSelection} from './selection';
import type {LocalTransferManifest,TransferCandidateInput} from './types';

export async function buildLocalTransferManifest(input:{state:StoredCheckStateV2;candidateIds:string[];excludedPhotoIds:string[];photoStore:PhotoStore;requestKey:string;now?:string}):Promise<LocalTransferManifest>{
  const selected=validateSelection(input.state,input.candidateIds);if(!selected.ok)throw new Error(`후보 선택 오류: ${selected.reason}`);
  const requestKey=requestKeySchema.parse(input.requestKey);const excluded=new Set(input.excludedPhotoIds);const warnings=new Set<string>();
  const candidates:TransferCandidateInput[]=await Promise.all(selected.ids.map(async id=>{
    const candidate=input.state.candidates.find(item=>item.id===id)!;
    const photos=(await Promise.all(CHECK_ITEMS.map(item=>input.photoStore.get(candidate.id,item.id)))).filter((photo):photo is NonNullable<typeof photo>=>!!photo&&!excluded.has(photo.id)).map(photo=>{
      if(!allowedPhotoMimes.has(photo.mime)||photo.bytes>MAX_TRANSFER_PHOTO_BYTES)throw new Error('지원하지 않는 사진이 포함되어 있어요.');
      return {id:photo.id,candidateId:photo.candidateId,itemId:photo.itemId,mime:photo.mime,bytes:photo.bytes,blob:photo.blob};
    });
    const answers=Object.entries(candidate.answers).map(([itemId,answer])=>({itemId,answer}));
    if(candidate.contact.phone)warnings.add('담당자 연락처가 포함되어 있어요.');
    if(answers.some(({answer})=>answer.memo&&containsSensitiveMemo(answer.memo)))warnings.add('민감할 수 있는 메모가 포함되어 있어요.');
    return {localCandidateId:candidate.id,alias:candidate.alias,listing:candidate.listing,terms:candidate.terms,contact:candidate.contact,commute:candidate.commute,answers,photos};
  }));
  const manifest:LocalTransferManifest={schemaVersion:1,requestKey,createdAt:input.now??new Date().toISOString(),candidates,expected:{candidates:candidates.length,answers:candidates.reduce((sum,c)=>sum+c.answers.length,0),photos:candidates.reduce((sum,c)=>sum+c.photos.length,0)},warnings:[...warnings]};
  transferTextSchema.parse(manifest);return manifest;
}
