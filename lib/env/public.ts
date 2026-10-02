import { z } from 'zod';

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export type PublicEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

export function parsePublicEnv(
  source: Record<string, string | undefined>,
): PublicEnv {
  const value = publicEnvSchema.parse(source);

  return {
    supabaseUrl: value.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: value.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export function getPublicEnv(): PublicEnv {
  return parsePublicEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}
