import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function middleware(request: NextRequest) {
  const session = cookies().get('session')?.value;

  // If no session, no need to do anything.
  if (!session) {
    return NextResponse.next();
  }

  // We need to make a request to an endpoint to validate the session.
  // This is a tradeoff for not being able to use the Firebase Admin SDK in middleware.
  const response = await fetch(`${request.nextUrl.origin}/api/auth/session`, {
    headers: {
      Cookie: `session=${session}`,
    },
  });

  // If the session is valid, just continue.
  if (response.ok) {
    return NextResponse.next();
  }

  // If the session is invalid (e.g., expired), clear the cookie and redirect.
  const responseHeaders = new Headers(request.headers);
  const nextResponse = NextResponse.next({ request: { headers: responseHeaders } });
  nextResponse.cookies.delete('session');

  return nextResponse;
}

// Note: Middleware will not run on /api routes.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth (our own auth routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
};
