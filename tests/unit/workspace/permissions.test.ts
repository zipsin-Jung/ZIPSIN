import { describe, expect, it } from 'vitest';
import { canCreateRecord } from '@/features/workspace/domain/permissions';
import { toWorkspaceErrorCode, workspaceErrorMessage } from '@/features/workspace/domain/errors';

// Denying the wrong role/space/kind or leaking a raw database error must fail these tests.
describe('paid pilot record permissions', () => {
  it.each([
    ['principal_broker', 'office_internal', 'note', true],
    ['associate_broker', 'office_internal', 'repair', true],
    ['principal_broker', 'current_contract', 'document', true],
    ['associate_broker', 'current_contract', 'photo', true],
    ['assistant', 'office_internal', 'photo', true],
    ['assistant', 'office_internal', 'document', true],
    ['assistant', 'office_internal', 'schedule', true],
    ['assistant', 'office_internal', 'task', true],
    ['assistant', 'office_internal', 'note', false],
    ['assistant', 'office_internal', 'repair', false],
    ['assistant', 'current_contract', 'document', true],
    ['landlord', 'current_contract', 'note', true],
    ['tenant', 'current_contract', 'photo', true],
    ['tenant', 'current_contract', 'repair', true],
    ['landlord', 'current_contract', 'document', true],
    ['tenant', 'current_contract', 'task', false],
    ['landlord', 'current_contract', 'schedule', false],
    ['landlord', 'office_internal', 'photo', false],
    ['tenant', 'office_internal', 'note', false],
    ['principal_broker', 'shared_history', 'note', false],
    ['tenant', 'shared_history', 'photo', false],
    ['repairer', 'current_contract', 'photo', false],
    ['ended', 'office_internal', 'note', false],
    [null, 'current_contract', 'note', false],
    ['principal_broker', 'current_contract', 'approve_contract', false],
    ['principal_broker', 'public', 'note', false],
  ])('checks %s / %s / %s', (role, space, kind, allowed) => {
    expect(canCreateRecord(role, space, kind)).toBe(allowed);
  });
});

describe('safe workspace errors', () => {
  it.each([
    [{ message: 'authentication_required' }, 'authentication_required'],
    [{ message: 'permission_denied' }, 'permission_denied'],
    [{ message: 'relation_ended' }, 'relation_ended'],
    [{ message: 'invitation_expired' }, 'invitation_expired'],
    [{ message: 'invitation_revoked' }, 'invitation_revoked'],
    [{ message: 'invitation_used' }, 'invitation_used'],
    [{ code: '23505', message: 'duplicate key exposes private data' }, 'conflict'],
    [{ code: '23503', message: 'private foreign key details' }, 'invalid_input'],
    [{ code: '23514', message: 'private constraint details' }, 'invalid_input'],
    [{ code: '42501', message: 'private table name' }, 'permission_denied'],
    [{ message: 'private address and contract contents' }, 'server_error'],
    [null, 'server_error'],
  ])('normalizes error %j', (error, expected) => {
    const code = toWorkspaceErrorCode(error);
    expect(code).toBe(expected);
    expect(workspaceErrorMessage(code)).not.toMatch(/private|duplicate key/);
    expect(workspaceErrorMessage(code).length).toBeGreaterThan(0);
  });
});
