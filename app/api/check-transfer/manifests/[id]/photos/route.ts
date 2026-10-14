import {NextResponse} from 'next/server';
import {requirePhoneVerifiedUser} from '@/features/auth/server/session';
import {createPhotoTransferService,type PhotoRepository} from '@/features/check-transfer/server/photo-service';
import {createSupabaseServerClient} from '@/lib/supabase/server';

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){try{const user=await requirePhoneVerifiedUser(),{id:manifestId}=await params,form=await request.formData(),file=form.get('file'),candidateId=String(form.get('candidateId')??''),itemId=String(form.get('itemId')??''),localPhotoId=String(form.get('localPhotoId')??'');if(!(file instanceof File)||!candidateId||!itemId||!localPhotoId)return NextResponse.json({code:'INVALID_PHOTO_INPUT'},{status:400});const client=await createSupabaseServerClient();const repository:PhotoRepository={
  async ownsCandidate(owner,candidate,manifest){const{data}=await client.from('candidate_drafts').select('id').eq('id',candidate).eq('owner_user_id',owner).eq('manifest_id',manifest).maybeSingle();return !!data},
  async photoExists(candidate,local){const{data}=await client.from('candidate_photos').select('id').eq('candidate_id',candidate).eq('local_photo_id',local).maybeSingle();return !!data},
  async uploadObject(path,value){const{error}=await client.storage.from('candidate-photos').upload(path,value,{upsert:false,contentType:value.type});if(error)throw new Error('PHOTO_UPLOAD_FAILED')},
  async linkPhoto(value){const{error}=await client.from('candidate_photos').insert({id:value.photoId,candidate_id:value.candidateId,local_photo_id:value.localPhotoId,item_id:value.itemId,storage_path:value.storagePath,bytes:value.bytes,mime:value.mime});if(error)throw error},
  async enqueueCleanup(value){await client.from('photo_cleanup_queue').upsert({owner_user_id:value.ownerUserId,storage_path:value.storagePath,reason:value.reason},{onConflict:'owner_user_id,storage_path'})},
};const result=await createPhotoTransferService(repository).upload({userId:user.id,candidateId,manifestId,itemId,file,localPhotoId});return NextResponse.json(result)}catch(error){const code=error instanceof Error?error.message:'PHOTO_UPLOAD_FAILED';const status=code==='AUTH_REQUIRED'?401:code==='TRANSFER_NOT_FOUND'?404:code.startsWith('PHOTO_')?400:500;return NextResponse.json({code},{status})}}
