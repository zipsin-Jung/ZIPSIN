import { createClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';

const config = {
  url: process.env.RECORD_STRESS_SUPABASE_URL,
  key: process.env.RECORD_STRESS_SUPABASE_ANON_KEY,
  email: process.env.RECORD_STRESS_EMAIL,
  password: process.env.RECORD_STRESS_PASSWORD,
  homeId: process.env.RECORD_STRESS_HOME_ID,
  officeId: process.env.RECORD_STRESS_OFFICE_ID,
};
const ready = Object.values(config).every(Boolean);

describe('record retry stress boundary', () => {
  it.skipIf(!ready)('TEST-RC-IDEM-001 sends 20 identical authenticated Preview writes and observes one logical record', async () => {
    const client = createClient(config.url!, config.key!);
    const { data: auth, error: authError } = await client.auth.signInWithPassword({ email: config.email!, password: config.password! });
    expect(authError).toBeNull();
    expect(auth.user).toBeTruthy();
    const idempotencyKey = crypto.randomUUID();
    const title = `중복 저장 검증 ${idempotencyKey}`;
    const write = () => client.rpc('create_home_record', {
      p_home_id: config.homeId!, p_office_id: config.officeId!, p_contract_id: null,
      p_space: 'office_internal', p_kind: 'note', p_title: title, p_body: '동일한 요청 20회',
      p_idempotency_key: idempotencyKey, p_task_due_at: null, p_task_assigned_to: null,
    });
    const responses = await Promise.all(Array.from({ length: 20 }, write));
    expect(responses.every(({ error }) => error === null)).toBe(true);
    expect(new Set(responses.map(({ data }) => data))).toHaveLength(1);
    const { count, error } = await client.from('records').select('id', { count: 'exact', head: true }).eq('idempotency_key', idempotencyKey);
    expect(error).toBeNull();
    expect(count).toBe(1);
  });
});
