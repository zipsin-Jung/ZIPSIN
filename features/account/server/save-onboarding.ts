'use server';

import {parseUserType} from '@/features/account/domain/profile';
import {requirePhoneVerifiedUser} from '@/features/auth/server/session';
import {createServerSupabaseClient} from '@/lib/supabase/server';

export async function saveOnboarding(input:{userType:string;transferConsent:boolean;marketingConsent:boolean},options:{requiresTransferConsent:boolean}={requiresTransferConsent:true}){
  if(options.requiresTransferConsent&&!input.transferConsent)throw new Error('TRANSFER_CONSENT_REQUIRED');
  await requirePhoneVerifiedUser();
  const userType=parseUserType(input.userType);
  const supabase=await createServerSupabaseClient();
  const {error}=await supabase.rpc('complete_check_onboarding',{p_user_type:userType});
  if(error)throw new Error('PROFILE_SAVE_FAILED');
  return {ok:true as const,marketingConsent:input.marketingConsent};
}
