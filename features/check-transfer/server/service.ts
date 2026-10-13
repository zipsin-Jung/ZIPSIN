import type {LocalTransferManifest,TransferCandidateInput,TransferCounts} from '../domain/types';

export type ManifestStatus='prepared'|'transferring'|'partial'|'complete'|'failed';
export type ManifestRecord={id:string;ownerUserId:string;requestKey:string;status:ManifestStatus;expected:TransferCounts;confirmed:TransferCounts};
export type TransferResult={manifestId:string;status:ManifestStatus;expected:TransferCounts;confirmed:TransferCounts;failedItems:Array<{itemKey:string;code:string;retryable:boolean}>};
export type TransferRepository={
  findManifest(userId:string,requestKey:string):Promise<ManifestRecord|undefined>;
  getManifest(id:string):Promise<ManifestRecord|undefined>;
  createManifest(value:{ownerUserId:string;requestKey:string;expected:TransferCounts}):Promise<ManifestRecord>;
  upsertCandidate(userId:string,manifestId:string,value:TransferCandidateInput):Promise<string>;
  replaceAnswers(userId:string,localCandidateId:string,value:TransferCandidateInput['answers']):Promise<void>;
  countConfirmed(userId:string,manifestId:string):Promise<TransferCounts>;
  updateManifest(id:string,status:ManifestStatus,confirmed:TransferCounts):Promise<void>;
};

function owns(manifest:ManifestRecord|undefined,userId:string):asserts manifest is ManifestRecord{if(!manifest||manifest.ownerUserId!==userId)throw new Error('TRANSFER_NOT_FOUND')}
export function deriveExpectedCounts(input:LocalTransferManifest):TransferCounts{return {candidates:input.candidates.length,answers:input.candidates.reduce((sum,candidate)=>sum+candidate.answers.length,0),photos:input.candidates.reduce((sum,candidate)=>sum+candidate.photos.length,0)}}
export function createTransferService(repository:TransferRepository){return {
  async createOrResumeManifest(userId:string,input:LocalTransferManifest):Promise<TransferResult>{const existing=await repository.findManifest(userId,input.requestKey);const manifest=existing??await repository.createManifest({ownerUserId:userId,requestKey:input.requestKey,expected:deriveExpectedCounts(input)});return {manifestId:manifest.id,status:manifest.status,expected:manifest.expected,confirmed:manifest.confirmed,failedItems:[]}},
  async upsertCandidateDraft(userId:string,manifestId:string,candidate:TransferCandidateInput){const manifest=await repository.getManifest(manifestId);owns(manifest,userId);const candidateId=await repository.upsertCandidate(userId,manifestId,candidate);await repository.replaceAnswers(userId,candidate.localCandidateId,candidate.answers);return {candidateId}},
  async finalizeTransfer(userId:string,manifestId:string):Promise<TransferResult>{const manifest=await repository.getManifest(manifestId);owns(manifest,userId);const confirmed=await repository.countConfirmed(userId,manifestId);const complete=confirmed.candidates===manifest.expected.candidates&&confirmed.answers===manifest.expected.answers&&confirmed.photos===manifest.expected.photos;const status:ManifestStatus=complete?'complete':'partial';await repository.updateManifest(manifest.id,status,confirmed);return {manifestId:manifest.id,status,expected:manifest.expected,confirmed,failedItems:complete?[]:[{itemKey:'server-counts',code:'COUNT_MISMATCH',retryable:true}]}},
}}
