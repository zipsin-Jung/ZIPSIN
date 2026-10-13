import {createServerClient} from '@supabase/ssr';
import {NextResponse, type NextRequest} from 'next/server';
import {readServerEnv} from '@/lib/env/server';

const PROTECTED = ['/my/candidates', '/ck/transfer/progress', '/ck/transfer/result'];

export async function refreshSession(request: NextRequest): Promise<NextResponse> {
  const env = readServerEnv();
  let response = NextResponse.next({request});
  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values) => {
        values.forEach(({name, value}) => request.cookies.set(name, value));
        response = NextResponse.next({request});
        values.forEach(({name, value, options}) => response.cookies.set(name, value, options));
      },
    },
  });
  const {data: {user}} = await supabase.auth.getUser();
  const isProtected = PROTECTED.some((path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`));
  if (!user && isProtected) {
    const login = request.nextUrl.clone();
    login.pathname = '/login';
    login.search = `?returnTo=${encodeURIComponent(`${request.nextUrl.pathname}${request.nextUrl.search}`)}`;
    return NextResponse.redirect(login);
  }
  return response;
}
