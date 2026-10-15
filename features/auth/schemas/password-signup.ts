import { z } from 'zod';
import { usernameSchema } from '@/features/auth/domain/username';

export const accountPasswordSchema = z.string().min(8).max(128)
  .regex(/[a-z]/, '영문 소문자가 필요합니다.')
  .regex(/[0-9]/, '숫자가 필요합니다.')
  .regex(/[^A-Za-z0-9]/, '특수문자가 필요합니다.');

export const passwordSignupSchema = z
  .object({
    username: usernameSchema,
    password: accountPasswordSchema,
    passwordConfirm: z.string().min(8).max(128),
    email: z.string().trim().toLowerCase().email(),
    termsAccepted: z.literal(true),
    privacyAccepted: z.literal(true),
  })
  .refine((value) => value.password === value.passwordConfirm, {
    message: '비밀번호가 서로 다릅니다.',
    path: ['passwordConfirm'],
  });

export type PasswordSignupInput = z.infer<typeof passwordSignupSchema>;

export const verifiedPasswordSignupSchema = passwordSignupSchema.and(z.object({
  challengeId: z.string().uuid(),
}));

export type VerifiedPasswordSignupInput = z.infer<typeof verifiedPasswordSignupSchema>;
