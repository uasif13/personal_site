import { NextRequest, NextResponse } from 'next/server';
import { CP_SESSION_COOKIE, verifySessionToken } from '@/lib/auth';

const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);
const PROTECTED_API_PREFIXES = ['/api/cp/problems', '/api/cp/attempts', '/api/cp/log'];
const PROTECTED_PAGE_PREFIXES = ['/cp/admin'];

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthed = await verifySessionToken(request.cookies.get(CP_SESSION_COOKIE)?.value);

  const isProtectedApi =
    MUTATING_METHODS.has(request.method) &&
    PROTECTED_API_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));

  if (isProtectedApi && !isAuthed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isProtectedPage = PROTECTED_PAGE_PREFIXES.some((prefix) =>
    matchesPrefix(pathname, prefix)
  );

  if (isProtectedPage && !isAuthed) {
    const loginUrl = new URL('/cp/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/cp/:path*', '/cp/admin/:path*'],
};
