import {NextResponse} from 'next/server';
import {transferTextSchema} from '@/features/check-transfer/domain/schema';
import type {LocalTransferManifest} from '@/features/check-transfer/domain/types';
import {requirePhoneVerifiedUser} from '@/features/auth/server/session';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {createSupabaseTransferRepository} from '@/features/check-transfer/server/repository';
import {createTransferService} from '@/features/check-transfer/server/service';

export async function POST(request:Request){try{const raw=await request.json();const parsed=transferTextSchema.safeParse(raw);if(!parsed.success)return NextResponse.json({code:'INVALID_TRANSFER_INPUT'},{status:400});const user=await requirePhoneVerifiedUser();const client=await createSupabaseServerClient();const service=createTransferService(createSupabaseTransferRepository(client));const result=await service.createOrResumeManifest(user.id,parsed.data as LocalTransferManifest);return NextResponse.json(result)}catch(error){if(error instanceof SyntaxError)return NextResponse.json({code:'INVALID_JSON'},{status:400});return NextResponse.json({code:'AUTH_REQUIRED'},{status:401})}}
