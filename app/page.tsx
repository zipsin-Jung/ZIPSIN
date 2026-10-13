import { redirect } from 'next/navigation';
import PublicHome from '@/components/PublicHome';
import { resolveRootDestination } from '@/features/navigation/root-entry';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();

  const destination = resolveRootDestination(Boolean(data.user));

  if (destination) {
    redirect(destination);
  }

  return <PublicHome />;
}
