import { z } from 'zod';

const optionalUuid = z.union([z.literal(''), z.uuid()]);
export const recordSchema = z.object({
  homeId: z.uuid(), officeId: optionalUuid, contractId: optionalUuid,
  space: z.enum(['office_internal', 'current_contract']),
  kind: z.enum(['note', 'photo', 'document', 'repair', 'task']),
  title: z.string().trim().min(1).max(120), body: z.string().trim().max(10000),
  idempotencyKey: z.uuid(), taskDueAt: z.string().optional().default(''), taskAssignedTo: optionalUuid.optional().default(''),
}).superRefine((value, context) => {
  if (value.space === 'office_internal' && !value.officeId) context.addIssue({ code: 'custom', path: ['officeId'], message: '사무소 정보가 필요합니다.' });
  if (value.space === 'current_contract' && !value.contractId) context.addIssue({ code: 'custom', path: ['contractId'], message: '현재 계약이 필요합니다.' });
  if (value.kind === 'task' && value.space !== 'office_internal') context.addIssue({ code: 'custom', path: ['kind'], message: '할 일은 사무소 내부에만 남길 수 있습니다.' });
});
export type RecordInput = z.infer<typeof recordSchema>;
