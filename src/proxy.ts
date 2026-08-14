import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * Next.js proxy (middleware) — guards /admin routes using the Better Auth
 * session cookie. The old Supabase JWT check is gone.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    const session = await auth.api.getSession({ headers: request.headers });
    const user = session?.user;

    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase());

    if (!adminEmails.includes((user.email ?? '').toLowerCase())) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
