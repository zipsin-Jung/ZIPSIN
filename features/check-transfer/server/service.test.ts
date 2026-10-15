import {describe,expect,it} from 'vitest';
import type {LocalTransferManifest} from '../domain/types';
import {createTransferService,type TransferRepository} from './service';

const input:LocalTransferManifest={schemaVersion:1,requestKey:'request-123',createdAt:'2026-10-13T00:00:00.000Z',warnings:[],expected:{candidates:1,answers:1,photos:0},candidates:[{localCandidateId:'local-1',alias:'첫 집',listing:{},terms:{},contact:{},commute:{},answers:[{itemId:'water-drain',answer:{status:'confirmed',source:'observed'}}],photos:[]}]};

function memoryRepository():TransferRepository&{manifestCount:()=>number;candidateCount:()=>number}{
  const manifests=new Map<string,any>(),candidates=new Map<string,any>();
  return {
    manifestCount:()=>manifests.size,candidateCount:()=>candidates.size,
    findManifest:async(user,key)=>[...manifests.values()].find(m=>m.ownerUserId===user&&m.requestKey===key),
    getManifest:async(id)=>manifests.get(id),
    createManifest:async(value)=>{const row={...value,id:`m-${manifests.size+1}`,status:'prepared' as const,confirmed:{candidates:0,answers:0,photos:0}};manifests.set(row.id,row);return row},
    upsertCandidate:async(user,manifestId,value)=>{const key=`${user}:${value.localCandidateId}`,id=candidates.get(key)?.id??`c-${candidates.size+1}`;candidates.set(key,{...value,id,ownerUserId:user,manifestId});return id},
    replaceAnswers:async()=>{},
    countConfirmed:async(user,manifestId)=>({candidates:[...candidates.values()].filter(c=>c.ownerUserId===user&&c.manifestId===manifestId).length,answers:1,photos:0}),
    updateManifest:async(id,status,confirmed)=>{const row=manifests.get(id);manifests.set(id,{...row,status,confirmed})},
  };
}

describe('idempotent candidate transfer',()=>{
  it('reuses the same manifest and candidate on duplicate requests',async()=>{const repo=memoryRepository(),service=createTransferService(repo);const first=await service.createOrResumeManifest('user-1',input);await service.upsertCandidateDraft('user-1',first.manifestId,input.candidates[0]);const second=await service.createOrResumeManifest('user-1',input);await service.upsertCandidateDraft('user-1',second.manifestId,input.candidates[0]);expect(second.manifestId).toBe(first.manifestId);expect(repo.manifestCount()).toBe(1);expect(repo.candidateCount()).toBe(1)});
  it('rejects a manifest owned by another user without exposing it',async()=>{const repo=memoryRepository(),service=createTransferService(repo);const first=await service.createOrResumeManifest('user-1',input);await expect(service.upsertCandidateDraft('user-2',first.manifestId,input.candidates[0])).rejects.toThrow('TRANSFER_NOT_FOUND')});
  it('marks count mismatches partial instead of complete',async()=>{const repo=memoryRepository(),service=createTransferService(repo);const first=await service.createOrResumeManifest('user-1',input);const result=await service.finalizeTransfer('user-1',first.manifestId);expect(result.status).toBe('partial');expect(result.confirmed.candidates).toBe(0)});
  it('derives expected counts instead of trusting client expected values',async()=>{const repo=memoryRepository(),service=createTransferService(repo),tampered={...input,expected:{candidates:0,answers:0,photos:0}};const first=await service.createOrResumeManifest('user-1',tampered);expect(first.expected).toEqual({candidates:1,answers:1,photos:0});const result=await service.finalizeTransfer('user-1',first.manifestId);expect(result.status).toBe('partial')});
  it('completes only after server counts match',async()=>{const repo=memoryRepository(),service=createTransferService(repo);const first=await service.createOrResumeManifest('user-1',input);await service.upsertCandidateDraft('user-1',first.manifestId,input.candidates[0]);const result=await service.finalizeTransfer('user-1',first.manifestId);expect(result.status).toBe('complete')});
});
