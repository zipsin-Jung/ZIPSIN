import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { formatContractDay } from '@/features/contracts/domain/lifecycle';

type DashboardRows = {
  homes: Array<{ id: string; label: string; address: string; updatedAt: string }>;
  contracts: Array<{ id: string; homeId: string; endsOn: string | null }>;
  records: Array<{ id: string; homeId: string; kind: string; title: string; taskStatus: string | null; taskDueAt: string | null; occurredAt: string }>;
  notifications: Array<{ kind: string; readAt: string | null }>;
  offices?: Array<{ id: string; name: string; canRegisterHome: boolean }>;
};

export type HomeDashboardRepository = {
  load(): Promise<{ data: DashboardRows | null; error: unknown }>;
};

export type DashboardHome = {
  id: string;
  label: string;
  address: string;
  endsOn: string | null;
  contractDay: ReturnType<typeof formatContractDay>;
  openTask: { id: string; title: string; dueAt: string | null } | null;
  updatedAt: string;
};

export type HomeDashboardResult =
  | { ok: true; homes: DashboardHome[]; offices: Array<{ id: string; name: string; canRegisterHome: boolean }>; unreadChatCount: number; notificationCount: number }
  | { ok: false; error: 'load_failed' };

export function formatDashboardAddress(addressLine1: string, addressDetail: string | null): string {
  return addressDetail ? `${addressLine1} · 상세 주소 보호됨` : addressLine1;
}

export async function loadHomeDashboard(repository: HomeDashboardRepository, input: { today?: Date } = {}): Promise<HomeDashboardResult> {
  const result = await repository.load();
  if (result.error || !result.data) return { ok: false, error: 'load_failed' };
  const rows = result.data;
  const contractByHome = new Map(rows.contracts.map((contract) => [contract.homeId, contract]));
  const openTasksByHome = new Map<string, DashboardHome['openTask']>();
  for (const record of [...rows.records].sort((a, b) => (a.taskDueAt ?? '9999').localeCompare(b.taskDueAt ?? '9999'))) {
    if (record.kind === 'task' && record.taskStatus !== 'done' && !openTasksByHome.has(record.homeId)) {
      openTasksByHome.set(record.homeId, { id: record.id, title: record.title, dueAt: record.taskDueAt });
    }
  }
  const homes = rows.homes.map((home) => {
    const contract = contractByHome.get(home.id);
    return { ...home, endsOn: contract?.endsOn ?? null, contractDay: formatContractDay(contract?.endsOn ?? null, input.today), openTask: openTasksByHome.get(home.id) ?? null };
  }).sort((a, b) => {
    const aExpiry = a.contractDay && a.contractDay.days <= 120 ? 0 : a.openTask ? 1 : 2;
    const bExpiry = b.contractDay && b.contractDay.days <= 120 ? 0 : b.openTask ? 1 : 2;
    if (aExpiry !== bExpiry) return aExpiry - bExpiry;
    if (aExpiry === 0 && a.contractDay && b.contractDay && a.contractDay.days !== b.contractDay.days) return a.contractDay.days - b.contractDay.days;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
  const unread = rows.notifications.filter((notice) => notice.readAt === null);
  return {
    ok: true,
    homes,
    offices: rows.offices ?? [],
    unreadChatCount: unread.filter((notice) => notice.kind === 'chat_message').length,
    notificationCount: unread.length,
  };
}

/* v8 ignore start -- external Supabase boundary is covered by Preview verification. */
export async function loadHomeDashboardFromSupabase(supabase: SupabaseClient, userId: string, today?: Date): Promise<HomeDashboardResult> {
  return loadHomeDashboard({
    async load() {
      const { data: memberships, error: membershipError } = await supabase.from('office_memberships').select('office_id, office_role').eq('user_id', userId).eq('status', 'active').is('ended_at', null).lte('started_at', new Date().toISOString());
      if (membershipError) return { data: null, error: membershipError };
      const officeIds = (memberships ?? []).map((item) => item.office_id);
      const [{ data: homes, error: homeError }, { data: notifications, error: notificationError }, { data: offices, error: officeError }] = await Promise.all([
        supabase.from('homes').select('id, home_label, address_line1, address_detail, updated_at').eq('status', 'active'),
        supabase.from('notifications').select('notification_kind, read_at').eq('user_id', userId),
        officeIds.length ? supabase.from('offices').select('id, name').in('id', officeIds) : Promise.resolve({ data: [], error: null }),
      ]);
      if (homeError || notificationError || officeError) return { data: null, error: homeError ?? notificationError ?? officeError };
      const homeIds = (homes ?? []).map((home) => home.id);
      const [{ data: contracts, error: contractError }, { data: records, error: recordError }] = await Promise.all([
        homeIds.length ? supabase.from('contracts').select('id, home_id, ends_on').in('home_id', homeIds).eq('status', 'active') : Promise.resolve({ data: [], error: null }),
        homeIds.length ? supabase.from('records').select('id, home_id, record_kind, title, task_status, task_due_at, occurred_at').in('home_id', homeIds).order('occurred_at', { ascending: false }) : Promise.resolve({ data: [], error: null }),
      ]);
      if (contractError || recordError) return { data: null, error: contractError ?? recordError };
      return {
        error: null,
        data: {
          homes: (homes ?? []).map((home) => ({ id: home.id, label: home.home_label ?? home.address_line1, address: formatDashboardAddress(home.address_line1, home.address_detail), updatedAt: home.updated_at })),
          contracts: (contracts ?? []).map((contract) => ({ id: contract.id, homeId: contract.home_id, endsOn: contract.ends_on })),
          records: (records ?? []).map((record) => ({ id: record.id, homeId: record.home_id, kind: record.record_kind, title: record.title, taskStatus: record.task_status, taskDueAt: record.task_due_at, occurredAt: record.occurred_at })),
          notifications: (notifications ?? []).map((notice) => ({ kind: notice.notification_kind, readAt: notice.read_at })),
          offices: (offices ?? []).map((office) => ({ id: office.id, name: office.name, canRegisterHome: (memberships ?? []).some((membership) => membership.office_id === office.id && membership.office_role === 'principal_broker') })),
        },
      };
    },
  }, { today });
}
/* v8 ignore stop */
