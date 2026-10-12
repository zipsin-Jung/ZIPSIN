import Link from 'next/link';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { updateTaskStateAction } from '@/features/tasks/actions/update-task';

export default async function TasksPage() {
  const { supabase } = await requireOnboardingComplete();
  const { data: tasks, error } = await supabase.from('records').select('id, home_id, title, task_status, task_due_at').eq('record_kind', 'task').eq('record_space', 'office_internal').order('task_due_at', { ascending: true });
  if (error) return <main className="mx-auto max-w-4xl px-5 py-16"><p role="alert">할 일을 불러오지 못했습니다.</p></main>;
  return <main className="mx-auto max-w-5xl px-5 py-10 sm:py-16"><Link href="/home" className="text-sm font-bold text-[#0b695c]">← 홈으로</Link><p className="mt-7 text-sm font-bold text-[#0b695c]">집마다 다음 행동</p><h1 className="mt-3 text-4xl font-extrabold tracking-[-0.05em] text-[#102a43]">할 일</h1>{tasks?.length ? <ul className="mt-8 grid gap-3">{tasks.map((task) => <li key={task.id} className="app-panel flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5"><div><Link href={`/homes/${task.home_id}`} className="font-extrabold text-[#102a43]">{task.title}</Link><p className="mt-1 text-sm text-[#607785]">{task.task_status === 'done' ? '완료' : task.task_status === 'in_progress' ? '진행 중' : '할 일'}</p></div><form action={updateTaskStateAction} className="flex gap-2"><input type="hidden" name="recordId" value={task.id} /><select name="status" defaultValue={task.task_status ?? 'todo'} className="min-h-11 rounded-xl border border-[#cbd9dc] bg-white px-3"><option value="todo">할 일</option><option value="in_progress">진행 중</option><option value="done">완료</option></select><button className="app-primary min-h-11 rounded-xl px-4 text-sm font-bold text-white">저장</button></form></li>)}</ul> : <div className="app-panel mt-8 rounded-[28px] p-10 text-center"><p className="font-bold text-[#244657]">지금 확인할 할 일이 없습니다.</p></div>}</main>;
}
