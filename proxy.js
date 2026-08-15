// Next.js 16 renamed middleware.js to proxy.js — an old middleware.js file is
// silently ignored (no build error, no warning), so this exact filename and the
// exported `proxy` function name both matter.
import { updateSession } from './lib/supabase/proxy';

export async function proxy(request) {
  return await updateSession(request);
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
