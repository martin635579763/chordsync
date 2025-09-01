
import { getAdminApp } from '@/app/auth/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

// This is a helper route to check session validity from middleware.
// It's a workaround because the Admin SDK cannot be used in Edge middleware.
export async function GET(request: NextRequest) {
  const session = request.cookies.get('session')?.value;

  if (!session) {
    return NextResponse.json({ isLogged: false }, { status: 401 });
  }

  try {
    const adminApp = getAdminApp();
    const decodedClaims = await getAuth(adminApp).verifySessionCookie(session, true);
    return NextResponse.json({ isLogged: true, email: decodedClaims.email }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ isLogged: false }, { status: 401 });
  }
}
