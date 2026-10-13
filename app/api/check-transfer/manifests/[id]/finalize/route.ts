import {NextResponse} from 'next/server';
import {requireUser} from '@/features/auth/server/session';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {createSupabaseTransferRepository} from '@/features/check-transfer/server/repository';
import {createTransferService} from '@/features/check-transfer/server/service';

export async function POST(_request:Request,{params}:{params:Promise<{id:string}>}){try{const user=await requireUser();const{id}=await params;const client=await createSupabaseServerClient();const result=await createTransferService(createSupabaseTransferRepository(client)).finalizeTransfer(user.id,id);return NextResponse.json(result)}catch(error){const code=error instanceof Error?error.message:'TRANSFER_FAILED';return NextResponse.json({code:code==='TRANSFER_NOT_FOUND'?code:'TRANSFER_FAILED'},{status:code==='TRANSFER_NOT_FOUND'?404:500})}}
