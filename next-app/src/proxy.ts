import { NextResponse, type NextRequest } from 'next/server';

/**
 * Route guard for the kitchen desk.
 *
 * This is defence in depth only: it redirects obviously-signed-out requests
 * before they reach a page. The real authorisation happens in the admin layout
 * and, on every API call, via `requireAdmin`.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The login page and the session endpoint must stay reachable.
  if (pathname.startsWith('/admin/login') || pathname === '/api/admin/session') {
    return NextResponse.next();
  }

  const hasSessionCookie = Boolean(request.cookies.get('pm_admin_session')?.value);
  if (!hasSessionCookie) {
    const login = new URL('/admin/login', request.url);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};