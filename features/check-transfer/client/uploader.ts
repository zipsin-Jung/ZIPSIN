import type {TransferPhotoInput} from '../domain/types';

export async function uploadPendingPhotos(photos:TransferPhotoInput[],send:(photo:TransferPhotoInput)=>Promise<void>,onlyIds?:string[]){
  const selected=onlyIds?photos.filter(photo=>onlyIds.includes(photo.id)):photos;const complete:string[]=[],failed:string[]=[];
  for(const photo of selected){try{await send(photo);complete.push(photo.id)}catch{failed.push(photo.id)}}
  return {complete,failed};
}
