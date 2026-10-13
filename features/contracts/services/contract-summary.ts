import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { buildLifecycleProgress, buildNextActions, formatContractDay, type PlanStatus } from '@/features/contracts/domain/lifecycle';

type Result<T> = Promise<{ data: T; error: unknown }>;
type HomeRow = { id: string; officeId: string | null; label: string; addressLine1: string; addressDetail: string | null };
type ContractRow = { id: string; kind: string; startsOn: string | null; endsOn: string | null };
type PartyPlanRow = { role: 'landlord' | 'tenant'; planStatus: PlanStatus; isCurrentUser: boolean };
type RecordRow = { id: string; kind: string; title: string; taskStatus: string | null; occurredAt: string };

export type ContractSummaryRepository = {
  getHome(homeId: string): Result<HomeRow | null>;
  getActiveContract(homeId: string): Result<ContractRow | null>;
  getPartyPlans(contractId: string): Result<PartyPlanRow[]>;
  getRecords(homeId: string, contractId: string): Result<RecordRow[]>;
  canEditContract(officeId: string | null, userId: string): Result<boolean>;
};

export type ContractHomeSummary = {
  home: HomeRow;
  contract: ContractRow | null;
  currentUserRelationship: 'landlord' | 'tenant' | null;
  ownPlanStatus: PlanStatus;
  partyPlans: Array<{ role: 'landlord' | 'tenant'; status: PlanStatus }>;
  canEditContract: boolean;
  contractDay: ReturnType<typeof formatContractDay>;
  hasContractDocument: boolean;
  hasMoveInPhoto: boolean;
  hasManagementRecord: boolean;
  hasMoveOutPhoto: boolean;
  openTask: { id: string; title: string } | null;
  lifecycle: ReturnType<typeof buildLifecycleProgress>;
  nextActions: ReturnType<typeof buildNextActions>;
};

export type ContractHomeSummaryResult =
  | { ok: true; status: 'ready' | 'no_contract'; summary: ContractHomeSummary }
  | { ok: false; error: 'load_failed' };

export async function loadContractHomeSummary(
  repository: ContractSummaryRepository,
  input: { homeId: string; userId: string; today?: Date },
): Promise<ContractHomeSummaryResult> {
  const homeResult = await repository.getHome(input.homeId);
  if (homeResult.error || !homeResult.data) return { ok: false, error: 'load_failed' };
  const home = homeResult.data;
  const [contractResult, editResult] = await Promise.all([
    repository.getActiveContract(input.homeId),
    repository.canEditContract(home.officeId, input.userId),
  ]);
  if (contractResult.error || editResult.error) return { ok: false, error: 'load_failed' };

  const contract = contractResult.data;
  if (!contract) {
    const lifecycle = buildLifecycleProgress({ hasContractDates: false, hasContractDocument: false, hasMoveInPhoto: false, hasManagementRecord: false, hasMoveOutPhoto: false });
    return {
      ok: true,
      status: 'no_contract',
      summary: {
        home,
        contract: null,
        currentUserRelationship: null,
        ownPlanStatus: 'undecided',
        partyPlans: [],
        canEditContract: editResult.data,
        contractDay: null,
        hasContractDocument: false,
        hasMoveInPhoto: false,
        hasManagementRecord: false,
        hasMoveOutPhoto: false,
        openTask: null,
        lifecycle,
        nextActions: buildNextActions({ homeId: home.id, canEditContract: editResult.data, endsOn: null, today: input.today, planStatus: 'undecided', hasContractDates: false, hasContractDocument: false, hasMoveInPhoto: false, hasMoveOutPhoto: false, openTask: null }),
      },
    };
  }

  const [partyPlansResult, recordsResult] = await Promise.all([
    repository.getPartyPlans(contract.id),
    repository.getRecords(home.id, contract.id),
  ]);
  if (partyPlansResult.error || recordsResult.error) return { ok: false, error: 'load_failed' };

  const records = recordsResult.data;
  const relationship = partyPlansResult.data.find((item) => item.isCurrentUser);
  const ownPlanStatus = relationship?.planStatus ?? 'undecided';
  const partyPlans = partyPlansResult.data.map((item) => ({ role: item.role, status: item.planStatus }));
  const hasContractDocument = records.some((item) => item.kind === 'document' && /계약/.test(item.title));
  const hasMoveInPhoto = records.some((item) => item.kind === 'photo' && /입주/.test(item.title));
  const hasManagementRecord = records.some((item) => ['repair', 'note'].includes(item.kind));
  const hasMoveOutPhoto = records.some((item) => item.kind === 'photo' && /퇴거/.test(item.title));
  const openTaskRecord = records.find((item) => item.kind === 'task' && item.taskStatus !== 'done');
  const openTask = openTaskRecord ? { id: openTaskRecord.id, title: openTaskRecord.title } : null;
  const hasContractDates = Boolean(contract.startsOn && contract.endsOn);
  const lifecycle = buildLifecycleProgress({ hasContractDates, hasContractDocument, hasMoveInPhoto, hasManagementRecord, hasMoveOutPhoto });

  return {
    ok: true,
    status: 'ready',
    summary: {
      home,
      contract,
      currentUserRelationship: relationship?.role ?? null,
      ownPlanStatus,
      partyPlans,
      canEditContract: editResult.data,
      contractDay: formatContractDay(contract.endsOn, input.today),
      hasContractDocument,
      hasMoveInPhoto,
      hasManagementRecord,
      hasMoveOutPhoto,
      openTask,
      lifecycle,
      nextActions: buildNextActions({ homeId: home.id, canEditContract: editResult.data, endsOn: contract.endsOn, today: input.today, planStatus: ownPlanStatus, hasContractDates, hasContractDocument, hasMoveInPhoto, hasMoveOutPhoto, openTask }),
    },
  };
}

/* v8 ignore start -- exercised through authenticated Preview and page boundary tests. */
export async function loadContractHomeSummaryFromSupabase(
  supabase: SupabaseClient,
  input: { homeId: string; userId: string; today?: Date },
) {
  return loadContractHomeSummary(createSupabaseContractSummaryRepository(supabase), input);
}

export function createSupabaseContractSummaryRepository(supabase: SupabaseClient): ContractSummaryRepository {
  return {
    async getHome(homeId) {
      const { data, error } = await supabase.from('homes').select('id, office_id, home_label, address_line1, address_detail').eq('id', homeId).eq('status', 'active').maybeSingle();
      return { data: data ? { id: data.id, officeId: data.office_id, label: data.home_label ?? data.address_line1, addressLine1: data.address_line1, addressDetail: data.address_detail } : null, error };
    },
    async getActiveContract(homeId) {
      const { data, error } = await supabase.from('contracts').select('id, contract_kind, starts_on, ends_on').eq('home_id', homeId).eq('status', 'active').maybeSingle();
      return { data: data ? { id: data.id, kind: data.contract_kind, startsOn: data.starts_on, endsOn: data.ends_on } : null, error };
    },
    async getPartyPlans(contractId) {
      const { data, error } = await supabase.rpc('get_contract_party_plan_statuses', { p_contract_id: contractId });
      return { data: (data ?? []).map((item: { relationship_role: string; plan_status: string; is_current_user: boolean }) => ({ role: item.relationship_role as PartyPlanRow['role'], planStatus: item.plan_status as PlanStatus, isCurrentUser: item.is_current_user })), error };
    },
    async getRecords(homeId, contractId) {
      const { data, error } = await supabase.from('records').select('id, record_kind, title, task_status, occurred_at').eq('home_id', homeId).or(`contract_id.eq.${contractId},record_space.eq.office_internal`).order('occurred_at', { ascending: false });
      return { data: (data ?? []).map((item) => ({ id: item.id, kind: item.record_kind, title: item.title, taskStatus: item.task_status, occurredAt: item.occurred_at })), error };
    },
    async canEditContract(officeId, userId) {
      if (!officeId) return { data: false, error: null };
      const { data, error } = await supabase.from('office_memberships').select('office_role').eq('office_id', officeId).eq('user_id', userId).eq('status', 'active').is('ended_at', null).in('office_role', ['principal_broker', 'associate_broker']).maybeSingle();
      return { data: Boolean(data), error };
    },
  };
}
/* v8 ignore stop */
