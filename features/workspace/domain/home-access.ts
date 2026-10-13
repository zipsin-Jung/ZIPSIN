import type { WorkspaceRole } from './permissions';

const officeRoles = new Set<WorkspaceRole>([
  'principal_broker',
  'associate_broker',
  'assistant',
]);

/** Role capability only. Live membership and home ownership are checked by RLS/RPC. */
export function canUseOfficeHome(role: unknown): role is WorkspaceRole {
  return officeRoles.has(role as WorkspaceRole);
}
