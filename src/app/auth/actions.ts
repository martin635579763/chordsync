'use server';

import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from './firebase-admin';

// Exchange the ID token for a session cookie.
export async function createSession(idToken: string) {
    try {
        const adminApp = getAdminApp();
        if (!adminApp) {
            // This case should be handled by the calling function, but we log it here.
            console.error("Firebase Admin App not initialized. Cannot create session.");
            return { success: false, error: 'Server is not configured for authentication.' };
        }
        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
        const sessionCookie = await getAuth(adminApp).createSessionCookie(idToken, { expiresIn });

        cookies().set('session', sessionCookie, {
            maxAge: expiresIn,
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to create session:", error);
        return { success: false, error: 'Failed to create session.' };
    }
}

// Sign out the user by clearing the session cookie.
export async function signOut() {
    cookies().delete('session');
}
