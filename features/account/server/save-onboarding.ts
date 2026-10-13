'use server';

import {buildOnboardingRecords,parseUserType} from '@/features/account/domain/profile';
import {requireUser} from '@/features/auth/server/session';
import {createSupabaseServerClient} from '@/lib/supabase/server';

export async function saveOnboarding(input:{userType:string;transferConsent:boolean;marketingConsent:boolean},options:{requiresTransferConsent:boolean}={requiresTransferConsent:true}){
  if(options.requiresTransferConsent&&!input.transferConsent)throw new Error('TRANSFER_CONSENT_REQUIRED');
  const user=await requireUser();
  const records=buildOnboardingRecords({userId:user.id,userType:parseUserType(input.userType)});
  const supabase=await createSupabaseServerClient();
  const {error:profileError}=await supabase.from('profiles').upsert({id:records.profile.id,user_type:records.profile.userType,onboarding_state:records.profile.onboardingState});
  if(profileError)throw new Error('PROFILE_SAVE_FAILED');
  const {error:sourceError}=await supabase.from('signup_attributions').upsert({user_id:records.attribution.userId,source:records.attribution.source},{onConflict:'user_id,source'});
  if(sourceError)throw new Error('ATTRIBUTION_SAVE_FAILED');
  return {ok:true as const,marketingConsent:input.marketingConsent};
}
