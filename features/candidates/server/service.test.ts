import {describe,expect,it,vi} from 'vitest';
import {createCandidateService,type CandidateRepository} from './service';
const row={id:'c1',ownerUserId:'u1',localCandidateId:'l1',alias:'첫 집',listing:{},terms:{},contact:{},commute:{},answers:[],photos:[{id:'p1',itemId:'water-drain',storagePath:'u1/c1/p1'}],createdAt:'2026-10-13'};
const repo=(overrides:Partial<CandidateRepository>={}):CandidateRepository=>({list:async()=>[row],get:async()=>row,signPhotos:async paths=>paths.map(path=>({path,url:'signed'})),removeStorage:async()=>({failed:[]}),removeDatabase:async()=>true,...overrides});
describe('candidate ownership service',()=>{
  it('returns owner list and short-lived signed photos',async()=>{const service=createCandidateService(repo());expect(await service.listCandidateDrafts('u1')).toHaveLength(1);expect((await service.getCandidateDraft('u1','c1'))?.signedPhotos[0].url).toBe('signed')});
  it('does not expose a missing or other-owner candidate',async()=>{const service=createCandidateService(repo({get:async()=>undefined}));expect(await service.getCandidateDraft('u2','c1')).toBeNull();expect(await service.deleteCandidateDraft('u2','c1')).toEqual({status:'not-found'})});
  it('keeps database row when storage deletion is partial',async()=>{const removeDb=vi.fn(async()=>true),service=createCandidateService(repo({removeStorage:async()=>({failed:['u1/c1/p1']}),removeDatabase:removeDb}));expect(await service.deleteCandidateDraft('u1','c1')).toEqual({status:'partial',remainingStorage:['u1/c1/p1'],databaseDeleted:false});expect(removeDb).not.toHaveBeenCalled()});
  it('deletes database after storage succeeds',async()=>{const service=createCandidateService(repo());expect(await service.deleteCandidateDraft('u1','c1')).toEqual({status:'deleted',remainingStorage:[],databaseDeleted:true})});
});
