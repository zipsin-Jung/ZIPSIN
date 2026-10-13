import 'server-only';
import type {SupabaseClient} from '@supabase/supabase-js';
import type {TransferCandidateInput,TransferCounts} from '../domain/types';
import type {ManifestRecord,ManifestStatus,TransferRepository} from './service';

const empty:TransferCounts={candidates:0,answers:0,photos:0};
const counts=(value:unknown):TransferCounts=>{const row=(value??{}) as Partial<TransferCounts>;return {candidates:Number(row.candidates??0),answers:Number(row.answers??0),photos:Number(row.photos??0)}};
const manifest=(row:any):ManifestRecord=>({id:row.id,ownerUserId:row.owner_user_id,requestKey:row.request_key,status:row.status,expected:counts(row.expected_counts_json),confirmed:counts(row.confirmed_counts_json)});

export function createSupabaseTransferRepository(client:SupabaseClient):TransferRepository{return {
  async findManifest(userId,requestKey){const {data,error}=await client.from('transfer_manifests').select('*').eq('owner_user_id',userId).eq('request_key',requestKey).maybeSingle();if(error)throw new Error('MANIFEST_READ_FAILED');return data?manifest(data):undefined},
  async getManifest(id){const {data,error}=await client.from('transfer_manifests').select('*').eq('id',id).maybeSingle();if(error)throw new Error('MANIFEST_READ_FAILED');return data?manifest(data):undefined},
  async createManifest(value){const {data,error}=await client.from('transfer_manifests').insert({owner_user_id:value.ownerUserId,request_key:value.requestKey,expected_counts_json:value.expected,confirmed_counts_json:empty}).select('*').single();if(error||!data)throw new Error('MANIFEST_CREATE_FAILED');return manifest(data)},
  async upsertCandidate(userId,manifestId,value){const {data,error}=await client.from('candidate_drafts').upsert({owner_user_id:userId,manifest_id:manifestId,local_candidate_id:value.localCandidateId,alias:value.alias,listing_json:value.listing,terms_json:value.terms,contact_json:value.contact,commute_json:value.commute},{onConflict:'owner_user_id,local_candidate_id'}).select('id').single();if(error||!data)throw new Error('CANDIDATE_SAVE_FAILED');return data.id},
  async replaceAnswers(userId,localCandidateId,value){const {data,error}=await client.from('candidate_drafts').select('id').eq('owner_user_id',userId).eq('local_candidate_id',localCandidateId).single();if(error||!data)throw new Error('CANDIDATE_NOT_FOUND');if(!value.length)return;const {error:answerError}=await client.from('candidate_answers').upsert(value.map(({itemId,answer})=>({candidate_id:data.id,item_id:itemId,status:answer.status,source:answer.source,memo:answer.memo??null,action_checks_json:answer.actionChecks??{}})),{onConflict:'candidate_id,item_id'});if(answerError)throw new Error('ANSWERS_SAVE_FAILED')},
  async countConfirmed(userId,manifestId){const {data,error}=await client.from('candidate_drafts').select('id,candidate_answers(id),candidate_photos(id)').eq('owner_user_id',userId).eq('manifest_id',manifestId);if(error)throw new Error('TRANSFER_COUNT_FAILED');return {candidates:data.length,answers:data.reduce((n,row)=>n+(row.candidate_answers?.length??0),0),photos:data.reduce((n,row)=>n+(row.candidate_photos?.length??0),0)}},
  async updateManifest(id,status:ManifestStatus,confirmed){const {error}=await client.from('transfer_manifests').update({status,confirmed_counts_json:confirmed,updated_at:new Date().toISOString()}).eq('id',id);if(error)throw new Error('MANIFEST_UPDATE_FAILED')},
}}
