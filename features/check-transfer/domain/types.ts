import type {CandidateV2,CheckAnswer} from '@/lib/zipsin-check/types';

export type TransferPhotoInput={id:string;candidateId:string;itemId:string;mime:string;bytes:number;blob:Blob};
export type TransferCandidateInput={
  localCandidateId:string;alias:string;listing:CandidateV2['listing'];terms:CandidateV2['terms'];contact:CandidateV2['contact'];commute:CandidateV2['commute'];
  answers:Array<{itemId:string;answer:CheckAnswer}>;photos:TransferPhotoInput[];
};
export type TransferCounts={candidates:number;answers:number;photos:number};
export type LocalTransferManifest={schemaVersion:1;requestKey:string;createdAt:string;candidates:TransferCandidateInput[];expected:TransferCounts;warnings:string[]};
