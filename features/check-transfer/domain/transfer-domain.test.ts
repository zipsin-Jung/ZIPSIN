import {describe,expect,it} from 'vitest';
import {createCandidateV2} from '@/lib/zipsin-check/state';
import type {PhotoStore,StoredPhoto} from '@/lib/zipsin-check/photo-store';
import type {StoredCheckStateV2} from '@/lib/zipsin-check/types';
import {buildLocalTransferManifest} from './build-local-manifest';
import {validateSelection} from './selection';

const candidate=createCandidateV2({id:'candidate-1',alias:'햇살 집',index:1,now:'2026-10-13T00:00:00.000Z'});
const state:StoredCheckStateV2={schemaVersion:2,candidates:[candidate],compareCandidateIds:['candidate-1'],activeCandidateId:'candidate-1'};
const photo:StoredPhoto={id:'candidate-1::water-drain',candidateId:'candidate-1',itemId:'water-drain',blob:new Blob(['photo'],{type:'image/jpeg'}),mime:'image/jpeg',bytes:5,createdAt:'2026-10-13T00:00:00.000Z'};
const store:PhotoStore={get:async(c,i)=>c===photo.candidateId&&i===photo.itemId?photo:undefined,put:async()=>{},count:async()=>1,remove:async()=>{},removeCandidate:async()=>{}};

describe('transfer selection',()=>{
  it('requires one to three active candidates',()=>{
    expect(validateSelection(state,[])).toEqual({ok:false,reason:'empty'});
    expect(validateSelection(state,['missing'])).toEqual({ok:false,reason:'missing'});
    expect(validateSelection({...state,candidates:[candidate,{...candidate,id:'2'},{...candidate,id:'3'},{...candidate,id:'4'}]},['candidate-1','2','3','4'])).toEqual({ok:false,reason:'max-three'});
  });

  it('builds counts and lets a photo be excluded',async()=>{
    const included=await buildLocalTransferManifest({state,candidateIds:['candidate-1'],excludedPhotoIds:[],photoStore:store,requestKey:'request-123'});
    expect(included.expected).toEqual({candidates:1,answers:0,photos:1});
    expect(included.candidates[0].photos).toHaveLength(1);
    const excluded=await buildLocalTransferManifest({state,candidateIds:['candidate-1'],excludedPhotoIds:[photo.id],photoStore:store,requestKey:'request-123'});
    expect(excluded.expected.photos).toBe(0);
    expect(excluded.requestKey).toBe('request-123');
  });

  it('rejects unsupported local photo content',async()=>{
    const bad={...photo,mime:'image/gif'};
    const badStore={...store,get:async()=>bad};
    await expect(buildLocalTransferManifest({state,candidateIds:['candidate-1'],excludedPhotoIds:[],photoStore:badStore,requestKey:'request-123'})).rejects.toThrow('지원하지 않는 사진');
  });
});
