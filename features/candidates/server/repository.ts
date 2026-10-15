import 'server-only';import type {SupabaseClient} from '@supabase/supabase-js';import type {CandidateDraftDetail,CandidateRepository} from './service';
const map=(row:any):CandidateDraftDetail=>({id:row.id,ownerUserId:row.owner_user_id,localCandidateId:row.local_candidate_id,alias:row.alias,listing:row.listing_json??{},terms:row.terms_json??{},contact:row.contact_json??{},commute:row.commute_json??{},answers:(row.candidate_answers??[]).map((a:any)=>({itemId:a.item_id,status:a.status,source:a.source,memo:a.memo,actionChecks:a.action_checks_json})),photos:(row.candidate_photos??[]).map((p:any)=>({id:p.id,itemId:p.item_id,storagePath:p.storage_path})),createdAt:row.created_at});
const selection='*,candidate_answers(*),candidate_photos(*)';
export function createSupabaseCandidateRepository(client:SupabaseClient):CandidateRepository{return {
  async list(userId){const{data,error}=await client.from('candidate_drafts').select(selection).eq('owner_user_id',userId).order('created_at',{ascending:false});if(error)throw new Error('CANDIDATE_LIST_FAILED');return data.map(map)},
  async get(userId,id){const{data,error}=await client.from('candidate_drafts').select(selection).eq('owner_user_id',userId).eq('id',id).maybeSingle();if(error)throw new Error('CANDIDATE_READ_FAILED');return data?map(data):undefined},
  async signPhotos(paths){return Promise.all(paths.map(async path=>{const{data,error}=await client.storage.from('candidate-photos').createSignedUrl(path,300);if(error)throw new Error('PHOTO_SIGN_FAILED');return {path,url:data.signedUrl}}))},
  async removeStorage(paths){const failed:string[]=[];for(const path of paths){const{error}=await client.storage.from('candidate-photos').remove([path]);if(error)failed.push(path)}return{failed}},
  async removeDatabase(userId,id){const{data,error}=await client.from('candidate_drafts').delete().eq('owner_user_id',userId).eq('id',id).select('id');return !error&&data.length===1},
}}
