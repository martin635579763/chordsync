
import { type NextRequest, NextResponse } from 'next/server';

// This middleware is now empty as we are no longer using server-side session cookies.
// Authentication is handled by passing ID tokens from the client to server actions.
export async function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
