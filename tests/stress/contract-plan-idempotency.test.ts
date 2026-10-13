import { createClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';

const config = {
  url: process.env.CONTRACT_STRESS_SUPABASE_URL,
  key: process.env.CONTRACT_STRESS_SUPABASE_ANON_KEY,
  serviceRoleKey: process.env.CONTRACT_STRESS_SUPABASE_SERVICE_ROLE_KEY,
  email: process.env.CONTRACT_STRESS_EMAIL,
  password: process.env.CONTRACT_STRESS_PASSWORD,
  contractId: process.env.CONTRACT_STRESS_CONTRACT_ID,
};
const ready = Object.values(config).every(Boolean);

describe('contract plan retry stress boundary', () => {
  it.skipIf(!ready)('TEST-ZH-LIFE-003-H keeps one logical state after 20 identical authenticated writes', async () => {
    const client = createClient(config.url!, config.key!);
    const admin = createClient(config.url!, config.serviceRoleKey!, { auth: { persistSession: false } });
    const { data: auth, error: authError } = await client.auth.signInWithPassword({ email: config.email!, password: config.password! });
    expect(authError).toBeNull();
    expect(auth.user).toBeTruthy();
    const { count: eventCountBefore, error: eventCountBeforeError } = await admin.from('contract_plan_events').select('id', { count: 'exact', head: true }).eq('contract_id', config.contractId!).eq('subject_user_id', auth.user!.id);
    expect(eventCountBeforeError).toBeNull();
    const responses = await Promise.all(Array.from({ length: 20 }, () => client.rpc('set_own_contract_plan', {
      p_contract_id: config.contractId!,
      p_plan_status: 'renewal_considering',
    })));
    expect(responses.every(({ error }) => error === null)).toBe(true);
    expect(new Set(responses.map(({ data }) => data))).toHaveLength(1);
    const { count, error } = await admin.from('contract_plan_states').select('id', { count: 'exact', head: true }).eq('contract_id', config.contractId!).eq('subject_user_id', auth.user!.id);
    expect(error).toBeNull();
    expect(count).toBe(1);
    const { count: eventCountAfter, error: eventCountAfterError } = await admin.from('contract_plan_events').select('id', { count: 'exact', head: true }).eq('contract_id', config.contractId!).eq('subject_user_id', auth.user!.id);
    expect(eventCountAfterError).toBeNull();
    expect((eventCountAfter ?? 0) - (eventCountBefore ?? 0)).toBeLessThanOrEqual(1);
  });
});
