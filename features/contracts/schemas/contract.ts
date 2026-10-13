import { z } from 'zod';

const isoDate = z.union([
  z.literal(''),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, '올바른 날짜를 입력해 주세요.'),
]);

export const contractSchema = z.object({
  homeId: z.uuid(),
  contractKind: z.enum(['owner_occupied', 'jeonse', 'monthly_rent', 'other']),
  startsOn: isoDate,
  endsOn: isoDate,
  idempotencyKey: z.uuid(),
}).superRefine((value, context) => {
  if (value.startsOn && value.endsOn && value.endsOn < value.startsOn) {
    context.addIssue({ code: 'custom', path: ['endsOn'], message: '만기일은 시작일보다 빠를 수 없습니다.' });
  }
});

export const contractPlanSchema = z.object({
  contractId: z.uuid(),
  planStatus: z.enum(['undecided', 'renewal_considering', 'move_out_preparing']),
});

export type ContractInput = z.infer<typeof contractSchema>;
export type ContractPlanInput = z.infer<typeof contractPlanSchema>;
