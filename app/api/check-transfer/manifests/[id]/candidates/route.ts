import {NextResponse} from 'next/server';
import type {TransferCandidateInput} from '@/features/check-transfer/domain/types';
import {requirePhoneVerifiedUser} from '@/features/auth/server/session';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {createSupabaseTransferRepository} from '@/features/check-transfer/server/repository';
import {createTransferService} from '@/features/check-transfer/server/service';

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){try{const user=await requirePhoneVerifiedUser();const candidate=await request.json() as TransferCandidateInput;if(!candidate.localCandidateId||!candidate.alias)return NextResponse.json({code:'INVALID_CANDIDATE'},{status:400});const {id}=await params;const client=await createSupabaseServerClient();const result=await createTransferService(createSupabaseTransferRepository(client)).upsertCandidateDraft(user.id,id,candidate);return NextResponse.json({ok:true,...result})}catch(error){const code=error instanceof Error?error.message:'TRANSFER_FAILED';if(code==='TRANSFER_NOT_FOUND')return NextResponse.json({code},{status:404});if(code==='AUTH_REQUIRED')return NextResponse.json({code},{status:401});return NextResponse.json({code:'CANDIDATE_SAVE_FAILED'},{status:500})}}
