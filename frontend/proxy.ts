import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('accessToken');

  if (!accessToken && pathname.startsWith('/account')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (!accessToken && pathname.startsWith('/admin') && pathname !== '/admin/login') {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/account', '/account/:path*', '/admin', '/admin/:path*'],
};
