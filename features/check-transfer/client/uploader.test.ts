import {describe,expect,it,vi} from 'vitest';
import {uploadPendingPhotos} from './uploader';

const photos=[{id:'p1',candidateId:'c1',itemId:'water-drain',mime:'image/jpeg',bytes:1,blob:new Blob(['1'])},{id:'p2',candidateId:'c1',itemId:'moisture-leak',mime:'image/jpeg',bytes:1,blob:new Blob(['2'])}];
describe('photo uploader',()=>{
  it('records each success and failure without hiding partial results',async()=>{const send=vi.fn(async(photo:{id:string})=>{if(photo.id==='p2')throw new Error('network')});const result=await uploadPendingPhotos(photos,send);expect(result).toEqual({complete:['p1'],failed:['p2']})});
  it('retries only selected failed ids',async()=>{const send=vi.fn(async()=>{});await uploadPendingPhotos(photos,send,['p2']);expect(send).toHaveBeenCalledOnce();expect(send).toHaveBeenCalledWith(photos[1])});
});
