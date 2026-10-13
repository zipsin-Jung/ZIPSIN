import type {StoredCheckStateV2} from '@/lib/zipsin-check/types';

export function validateSelection(state:StoredCheckStateV2,ids:string[]):{ok:true;ids:string[]}|{ok:false;reason:'empty'|'max-three'|'missing'}{
  const unique=[...new Set(ids)];
  if(!unique.length)return {ok:false,reason:'empty'};
  if(unique.length>3)return {ok:false,reason:'max-three'};
  if(unique.some(id=>!state.candidates.some(candidate=>candidate.id===id&&!candidate.archived)))return {ok:false,reason:'missing'};
  return {ok:true,ids:unique};
}
