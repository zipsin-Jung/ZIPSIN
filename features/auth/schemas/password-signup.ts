import { z } from 'zod';
import { usernameSchema } from '@/features/auth/domain/username';

export const passwordSignupSchema = z
  .object({
    username: usernameSchema,
    password: z.string().min(8).max(128),
    passwordConfirm: z.string().min(8).max(128),
    email: z.string().trim().toLowerCase().email(),
    termsAccepted: z.literal(true),
    privacyAccepted: z.literal(true),
    ageOver14: z.literal(true),
  })
  .refine((value) => value.password === value.passwordConfirm, {
    message: '비밀번호가 서로 다릅니다.',
    path: ['passwordConfirm'],
  });

export type PasswordSignupInput = z.infer<typeof passwordSignupSchema>;
