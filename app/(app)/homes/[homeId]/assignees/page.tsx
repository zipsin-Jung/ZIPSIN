import Link from "next/link";
import { z } from "zod";
import { requireOnboardingComplete } from "@/features/auth/guards/require-onboarding";
import { assignOfficeMemberAction, endOfficeAssignmentAction } from "@/features/assignments/actions/manage-assignment";

export default async function AssigneesPage({
  params,
}: {
  params: Promise<{ homeId: string }>;
}) {
  const { homeId } = await params;
  if (!z.uuid().safeParse(homeId).success) return <Denied />;
  const { supabase, user } = await requireOnboardingComplete();
  const { data: home } = await supabase
    .from("homes")
    .select("id, office_id, home_label, address_line1")
    .eq("id", homeId)
    .eq("status", "active")
    .maybeSingle();
  if (!home?.office_id) return <Denied />;
  const { data: principal } = await supabase
    .from("office_memberships")
    .select("id")
    .eq("office_id", home.office_id)
    .eq("user_id", user.id)
    .eq("office_role", "principal_broker")
    .eq("status", "active")
    .is("ended_at", null)
    .lte("started_at", new Date().toISOString())
    .maybeSingle();
  if (!principal) return <Denied />;
  const { data: members } = await supabase
    .from("office_memberships")
    .select("id, user_id, office_role")
    .eq("office_id", home.office_id)
    .eq("status", "active")
    .is("ended_at", null)
    .lte("started_at", new Date().toISOString());
  const { data: assignments } = await supabase
    .from("office_home_assignments")
    .select("id, assigned_user_id")
    .eq("office_id", home.office_id)
    .eq("home_id", homeId)
    .eq("status", "active")
    .is("ended_at", null);
  const assigned = new Map(assignments?.map((item) => [item.assigned_user_id, item.id]));
  return (
    <main className="mx-auto max-w-4xl px-5 py-10 sm:py-16">
      <Link
        href={`/homes/${homeId}`}
        className="text-sm font-bold text-[#0b695c]"
      >
        ← 집 기록으로
      </Link>
      <p className="mt-7 text-sm font-bold text-[#0b695c]">
        담당 집만 안전하게 연결
      </p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.05em] text-[#102a43]">
        담당자 관리
      </h1>
      <p className="mt-3 text-[#607785]">
        {home.home_label ?? home.address_line1}
      </p>
      <ul className="mt-8 grid gap-3">
        {members?.map((member) => (
          <li
            key={member.id}
            className="app-panel flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5"
          >
            <div>
              <strong className="text-[#102a43]">
                {member.office_role === "principal_broker"
                  ? "대표 공인중개사"
                  : member.office_role === "associate_broker"
                    ? "소속공인중개사"
                    : "중개보조원"}
              </strong>
              <p className="mt-1 text-sm text-[#607785]">
                {assigned.has(member.user_id)
                  ? "현재 담당자"
                  : "아직 배정되지 않음"}
              </p>
            </div>
            {assigned.has(member.user_id) ? (
              <form action={endOfficeAssignmentAction}>
                <input type="hidden" name="assignmentId" value={assigned.get(member.user_id)} />
                <input type="hidden" name="homeId" value={homeId} />
                <button className="min-h-11 rounded-xl border border-[#cbd9dc] px-4 text-sm font-bold text-[#496273]">담당 해제</button>
              </form>
            ) : (
              <form action={assignOfficeMemberAction}>
                <input type="hidden" name="officeId" value={home.office_id} />
                <input type="hidden" name="homeId" value={homeId} />
                <input type="hidden" name="userId" value={member.user_id} />
                <button className="app-primary min-h-11 rounded-xl px-4 text-sm font-bold text-white">
                  담당으로 배정
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}

function Denied() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <p role="alert">이 집의 담당자를 관리할 권한이 없습니다.</p>
      <Link href="/home" className="mt-5 inline-block font-bold text-[#0b695c]">
        홈으로
      </Link>
    </main>
  );
}
