import { redirect } from 'next/navigation';
import PublicHome from '@/components/PublicHome';
import { resolveRootDestination } from '@/features/navigation/root-entry';
import { isAccountOpen } from '@/lib/site/account-launch';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function Page() {
  // 로그인이 준비 중이면 계정 확인(DB) 없이 공개 홈만 보여준다.
  if (!isAccountOpen()) return <PublicHome />;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();

  const destination = resolveRootDestination(Boolean(data.user));

  if (destination) {
    redirect(destination);
  }

  return <PublicHome />;
}
