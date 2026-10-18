import { z } from 'zod';

export const homeSchema = z.object({
  officeId: z.uuid('사무소를 확인해 주세요.'),
  addressLine1: z.string().trim().min(5, '주소를 5~200자로 적어 주세요.').max(200, '주소를 5~200자로 적어 주세요.').regex(/^[^\p{Cc}]*$/u, '주소를 한 줄로 입력해 주세요.'),
  addressDetail: z.string().trim().max(120, '동·호수는 120자까지 적을 수 있어요.').regex(/^[^\p{Cc}]*$/u, '동·호수를 한 줄로 적어 주세요.'),
  homeLabel: z.string().trim().max(80, '내부 구분명은 80자까지 입력할 수 있습니다.').regex(/^[^\p{Cc}]*$/u, '내부 구분명을 한 줄로 입력해 주세요.'),
  idempotencyKey: z.uuid('등록 화면을 다시 열어 주세요.'),
});
export type HomeInput = z.infer<typeof homeSchema>;
export type HomeFormState = { error?: string; fieldErrors?: Partial<Record<keyof HomeInput, string>>; redirectTo?: string; homeId?: string };
export function homeFieldErrors(error: z.ZodError): HomeFormState['fieldErrors'] {
  return Object.fromEntries(error.issues.map((issue) => [issue.path[0], issue.message]));
}
