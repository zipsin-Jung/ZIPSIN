import { redirect } from 'next/navigation';
import { resolveRootDestination } from '@/features/navigation/root-entry';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();

  redirect(resolveRootDestination(Boolean(data.user)));
}
