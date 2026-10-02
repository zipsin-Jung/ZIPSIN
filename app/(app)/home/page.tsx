import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';

export default async function HomePage() {
  await requireOnboardingComplete();
  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold text-emerald-700">처음이시군요</p>
        <h1 className="mt-2 text-3xl font-bold">첫 집부터 천천히 시작해요</h1>
        <p className="mt-3 text-slate-600">아직 등록된 집이 없습니다. 다음 단계에서 첫 집 등록을 연결합니다.</p>
        <button className="mt-7 min-h-12 rounded-xl bg-emerald-900 px-5 py-3 font-semibold text-white" disabled type="button">첫 집 등록 준비 중</button>
      </section>
    </main>
  );
}
