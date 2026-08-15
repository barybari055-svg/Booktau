import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
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
    }
  );

  // Deliberately no logic between createServerClient and getClaims() — Supabase's
  // own docs warn a stray call in between can cause users to be randomly logged out.
  // Destructured defensively: if getClaims() can't reach Supabase at all (network
  // issue, misconfigured env var), it can return { data: null } rather than
  // { data: { claims: null } } — treat that the same as "not logged in" instead
  // of crashing the whole proxy with a TypeError.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims ?? null;

  if (request.nextUrl.pathname.startsWith('/dashboard') && !claims) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Must return this exact object, not a fresh NextResponse.next() — it carries
  // the refreshed session cookies that setAll() attached above.
  return supabaseResponse;
}
