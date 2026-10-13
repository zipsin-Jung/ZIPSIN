'use client';
import {createBrowserPhotoStore} from '@/lib/zipsin-check/photo-store';
import {loadCheckStateV2} from '@/lib/zipsin-check/storage';

export function readLocalCheckSource(storage:Storage=window.localStorage){
  const loaded=loadCheckStateV2(storage);if(!loaded.ok)throw new Error('LOCAL_CHECK_READ_FAILED');
  return {state:loaded.state,photoStore:createBrowserPhotoStore()};
}
