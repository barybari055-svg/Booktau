import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isDashboardRequest = request.nextUrl.pathname.startsWith('/dashboard');

  // If Supabase isn't configured at all, fail closed: treat every /dashboard
  // request as unauthenticated instead of crashing the whole proxy with a
  // raw 500. createServerClient() throws synchronously on a missing
  // URL/key -- confirmed directly against a live dev server, not assumed --
  // and a middleware-level crash isn't caught by app/error.js, since this
  // runs before the React tree even starts. A misconfigured deploy should
  // show a login page, not a stack trace.
  if (!supabaseUrl || !supabaseAnonKey) {
    if (isDashboardRequest) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  let claims = null;
  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    });

    // Deliberately no logic between createServerClient and getClaims() — Supabase's
    // own docs warn a stray call in between can cause users to be randomly logged out.
    // Destructured defensively: if getClaims() can't reach Supabase at all (network
    // issue, misconfigured env var), it can return { data: null } rather than
    // { data: { claims: null } } — treat that the same as "not logged in" instead
    // of crashing the whole proxy with a TypeError.
    const { data } = await supabase.auth.getClaims();
    claims = data?.claims ?? null;
  } catch {
    // Network failure, Supabase unreachable, etc. — same fail-closed behavior
    // as the missing-config case above, not a crash.
    claims = null;
  }

  if (isDashboardRequest && !claims) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Must return this exact object, not a fresh NextResponse.next() — it carries
  // the refreshed session cookies that setAll() attached above.
  return supabaseResponse;
}
