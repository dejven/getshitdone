import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Webhook endpoints use their own auth (API keys)
  if (request.nextUrl.pathname.startsWith('/api/webhooks/complete') ||
      request.nextUrl.pathname.startsWith('/api/webhooks/habits')) {
    return NextResponse.next();
  }

  // Auth endpoints are always accessible
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Auth pages are always accessible
  if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/setup') {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
