import 'server-only';
import { z } from 'zod';
import { parsePublicEnv } from './public';

export const parseServerEnv = parsePublicEnv;

export function getServerEnv() {
  return parseServerEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

const adminEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

export function parseAdminEnv(source: Record<string, string | undefined>) {
  const value = adminEnvSchema.parse(source);
  return {
    supabaseUrl: value.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey: value.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export function getAdminEnv() {
  return parseAdminEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}
