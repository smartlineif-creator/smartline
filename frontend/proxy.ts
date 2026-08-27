import { NextRequest, NextResponse } from 'next/server';

/** Best-effort read of the `role` claim from the mirror access-token cookie.
 * NOT a security check (signature isn't verified) — real authorization is on
 * the API. Used only to bounce an obvious non-admin from the /admin UI early. */
function readRole(token: string | undefined): string | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return (JSON.parse(json) as { role?: string }).role ?? null;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // `accessToken` is a 15-min mirror of the JWT; `sl_session` is a 30-day
  // "a session exists" marker set alongside the refresh token. Gate on either —
  // otherwise every navigation after 15 min idle bounced to the login page
  // even though the client could still silently refresh. Real authorization
  // is enforced by the API on every request; this is only a UX gate.
  const accessToken = request.cookies.get('accessToken')?.value;
  const hasSession = accessToken || request.cookies.get('sl_session');

  // Already-authenticated users shouldn't sit on a login/register page.
  // Gate on the access cookie (a live session) — not the 30-day sl_session
  // marker — to avoid a redirect loop when the session is actually dead.
  if (pathname === '/admin/login' && readRole(accessToken) === 'ADMIN') {
    return NextResponse.redirect(new URL('/admin', request.url));
  }
  if ((pathname === '/login' || pathname === '/register') && accessToken) {
    return NextResponse.redirect(new URL('/account', request.url));
  }

  if (!hasSession && pathname.startsWith('/account')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!hasSession) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    // If we can read a role and it isn't ADMIN, bounce before rendering the
    // shell. When the role can't be read (no/expired access cookie), fall
    // through — the admin layout re-checks via /auth/me and redirects.
    const role = readRole(accessToken);
    if (role && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/register', '/account', '/account/:path*', '/admin', '/admin/:path*'],
};
