import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';

export default async function RetiredAssigneesPage({
  params,
}: {
  params: Promise<{ homeId: string }>;
}) {
  const { homeId } = await params;
  await requireOnboardingComplete();
  if (!z.uuid().safeParse(homeId).success) redirect('/homes');
  redirect(`/homes/${homeId}`);
}
