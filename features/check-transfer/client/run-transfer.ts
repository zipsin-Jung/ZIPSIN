import type {LocalTransferManifest,TransferPhotoInput} from '../domain/types';
import type {TransferResult} from '../server/service';

export type TransferRequest=(path:string,init?:RequestInit)=>Promise<any>;
async function browserRequest(path:string,init?:RequestInit){const response=await fetch(path,init);const data=await response.json();if(!response.ok)throw new Error(data.code??'TRANSFER_REQUEST_FAILED');return data}
export async function runTransfer(manifest:LocalTransferManifest,request:TransferRequest=browserRequest,onStage?:(stage:string)=>void):Promise<TransferResult>{
  onStage?.('텍스트 저장 준비');const created=await request('/api/check-transfer/manifests',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(manifest)});const manifestId=created.manifestId as string;
  const serverCandidates=new Map<string,string>();for(const candidate of manifest.candidates){onStage?.(`${candidate.alias} 저장`);const result=await request(`/api/check-transfer/manifests/${manifestId}/candidates`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(candidate)});serverCandidates.set(candidate.localCandidateId,result.candidateId)}
  const photos=manifest.candidates.flatMap(candidate=>candidate.photos.map(photo=>({candidate,photo})));
  const localFailures:TransferResult['failedItems']=[];
  for(const {candidate,photo} of photos){onStage?.('사진 저장');try{await uploadPhoto(request,manifestId,serverCandidates.get(candidate.localCandidateId)!,photo)}catch(error){localFailures.push({itemKey:photo.id,code:error instanceof Error?error.message:'PHOTO_UPLOAD_FAILED',retryable:true})}}
  onStage?.('서버 저장 확인');const result=await request(`/api/check-transfer/manifests/${manifestId}/finalize`,{method:'POST'}) as TransferResult;
  return localFailures.length?{...result,status:'partial',failedItems:[...result.failedItems,...localFailures]}:result;
}
async function uploadPhoto(request:TransferRequest,manifestId:string,candidateId:string,photo:TransferPhotoInput){const body=new FormData();body.set('candidateId',candidateId);body.set('itemId',photo.itemId);body.set('localPhotoId',photo.id);body.set('file',photo.blob,'candidate-photo.jpg');return request(`/api/check-transfer/manifests/${manifestId}/photos`,{method:'POST',body})}
