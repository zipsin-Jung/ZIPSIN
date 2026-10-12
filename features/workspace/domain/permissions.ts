export type WorkspaceRole = 'principal_broker' | 'associate_broker' | 'assistant' | 'landlord' | 'tenant';
export type RecordSpace = 'office_internal' | 'current_contract';
export type RecordKind = 'note' | 'photo' | 'document' | 'repair' | 'schedule' | 'task';

/** Role capability only. The server/RPC must also check the live home/contract relationship. */
export function canCreateRecord(role: unknown, space: unknown, kind: unknown): boolean {
  if (space !== 'office_internal' && space !== 'current_contract') return false;
  if (!['note', 'photo', 'document', 'repair', 'schedule', 'task'].includes(kind as string)) return false;
  if (role === 'principal_broker' || role === 'associate_broker') return true;
  if (role === 'assistant') return ['photo', 'document', 'schedule', 'task'].includes(kind as string);
  return (role === 'landlord' || role === 'tenant') && space === 'current_contract'
    && ['note', 'photo', 'document', 'repair'].includes(kind as string);
}
