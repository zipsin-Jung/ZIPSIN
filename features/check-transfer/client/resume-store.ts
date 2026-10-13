'use client';
const KEY='zipsin-check:transfer-resume:v1';
export type TransferResume={requestKey:string;candidateIds:string[];excludedPhotoIds:string[];manifestId?:string};
export function saveTransferResume(value:TransferResume,storage:Storage=window.sessionStorage){storage.setItem(KEY,JSON.stringify(value))}
export function loadTransferResume(storage:Storage=window.sessionStorage):TransferResume|undefined{try{const raw=storage.getItem(KEY);return raw?JSON.parse(raw) as TransferResume:undefined}catch{return undefined}}
export function clearTransferResume(storage:Storage=window.sessionStorage){storage.removeItem(KEY)}
