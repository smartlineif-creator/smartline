import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // `accessToken` is a 15-min mirror of the JWT; `sl_session` is a 30-day
  // "a session exists" marker set alongside the refresh token. Gate on either —
  // otherwise every navigation after 15 min idle bounced to the login page
  // even though the client could still silently refresh. Real authorization
  // is enforced by the API on every request; this is only a UX gate.
  const hasSession =
    request.cookies.get('accessToken') || request.cookies.get('sl_session');

  if (!hasSession && pathname.startsWith('/account')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (!hasSession && pathname.startsWith('/admin') && pathname !== '/admin/login') {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/account', '/account/:path*', '/admin', '/admin/:path*'],
};
