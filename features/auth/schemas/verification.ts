import { z } from 'zod';

export function normalizeKoreanMobile(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!/^010\d{8}$/.test(digits)) {
    throw new Error('올바른 휴대전화번호를 입력해 주세요.');
  }
  return `+82${digits.slice(1)}`;
}

export function maskPhone(phoneE164: string): string {
  const local = phoneE164.replace(/^\+82/, '0');
  return `${local.slice(0, 3)}-****-${local.slice(-4)}`;
}

export const signupSchema = z.object({
  displayName: z.string().trim().min(2).max(50),
  email: z.string().trim().email(),
  challengeId: z.string().min(1),
  termsAccepted: z.literal(true),
  privacyAccepted: z.literal(true),
  ageOver14: z.literal(true),
  marketingSmsAccepted: z.boolean().default(false),
  marketingEmailAccepted: z.boolean().default(false),
});

export type SignupInput = z.infer<typeof signupSchema>;
