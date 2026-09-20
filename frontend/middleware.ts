import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Public paths bypass
  const publicPaths = [
    '/',
    '/register',
    '/login',
    '/onboard',
    '/about',
    '/blog',
    '/careers',
    '/contact',
    '/gdpr',
    '/press',
    '/privacy',
    '/security',
    '/soc2',
    '/terms',
    '/unauthorized',
    '/sitemap.xml',
    '/robots.txt',
    '/icon.png',
  ];

  if (
    publicPaths.includes(path) ||
    path.startsWith('/_next') ||
    path.startsWith('/api') || // Handled by FastAPI backend proxy
    path === '/favicon.ico' ||
    path === '/logo.png' ||
    path.match(/\.(png|jpg|jpeg|gif|svg|ico)$/)
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('catalyst_token')?.value;
  const role = request.cookies.get('catalyst_role')?.value;

  // Check token existence and expiration
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    const fullPath = request.nextUrl.search ? `${path}${request.nextUrl.search}` : path;
    loginUrl.searchParams.set('redirect', fullPath);
    return NextResponse.redirect(loginUrl);
  }

  // Verify JWT expiration claim if formatted as valid JWT
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payloadStr = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(payloadStr);
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        const loginUrl = new URL('/login', request.url);
        const fullPath = request.nextUrl.search ? `${path}${request.nextUrl.search}` : path;
        loginUrl.searchParams.set('expired', 'true');
        loginUrl.searchParams.set('redirect', fullPath);
        const res = NextResponse.redirect(loginUrl);
        res.cookies.delete('catalyst_token');
        res.cookies.delete('catalyst_role');
        return res;
      }
    }
  } catch {
    // If decoding fails, let the request proceed to backend verification
  }

  const normRole = role ? role.toLowerCase().trim() : '';

  // Role-based route authorization guards
  // 1. Analyst: Restricted to Dashboard, Customers, Segments, Analytics (cannot create campaigns or change settings)
  if (normRole === 'analyst') {
    if (
      path.includes('/settings') ||
      path.includes('/campaigns/new') ||
      path.includes('/ai-studio') ||
      path.includes('/campaign-studio')
    ) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // 2. Marketer: Restricted from Company Billing/Integrations/Settings
  if (normRole === 'marketer' || normRole === 'marketing_manager' || normRole === 'member') {
    if (path.includes('/settings') && request.nextUrl.searchParams.get('tab') === 'super') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // 3. Super Admin page guard
  if ((path.includes('/super-admin') || path.includes('/settings?tab=super')) && normRole !== 'super_admin') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
