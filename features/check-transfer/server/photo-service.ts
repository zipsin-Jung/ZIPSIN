import {allowedPhotoMimes,MAX_TRANSFER_PHOTO_BYTES} from '../domain/schema';

export type PhotoRepository={
  ownsCandidate(userId:string,candidateId:string,manifestId:string):Promise<boolean>;
  photoExists(candidateId:string,localPhotoId:string):Promise<boolean>;
  uploadObject(storagePath:string,file:File):Promise<void>;
  linkPhoto(value:{photoId:string;localPhotoId:string;candidateId:string;itemId:string;storagePath:string;bytes:number;mime:string}):Promise<void>;
  enqueueCleanup(value:{ownerUserId:string;storagePath:string;reason:string}):Promise<void>;
};

export function createPhotoTransferService(repository:PhotoRepository,newId:()=>string=()=>crypto.randomUUID()){return {async upload(input:{userId:string;candidateId:string;manifestId:string;itemId:string;file:File;localPhotoId:string}){
  if(!allowedPhotoMimes.has(input.file.type))throw new Error('PHOTO_TYPE_INVALID');if(input.file.size>MAX_TRANSFER_PHOTO_BYTES)throw new Error('PHOTO_TOO_LARGE');
  if(!await repository.ownsCandidate(input.userId,input.candidateId,input.manifestId))throw new Error('TRANSFER_NOT_FOUND');
  if(await repository.photoExists(input.candidateId,input.localPhotoId))return {status:'already-complete' as const,photoId:input.localPhotoId};const photoId=newId();
  const storagePath=`${input.userId}/${input.candidateId}/${photoId}`;await repository.uploadObject(storagePath,input.file);
  try{await repository.linkPhoto({photoId,localPhotoId:input.localPhotoId,candidateId:input.candidateId,itemId:input.itemId,storagePath,bytes:input.file.size,mime:input.file.type})}catch{await repository.enqueueCleanup({ownerUserId:input.userId,storagePath,reason:'db-link-failed'});throw new Error('PHOTO_LINK_FAILED')}
  return {status:'complete' as const,photoId};
}}}
