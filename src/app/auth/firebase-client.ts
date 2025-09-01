'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, onIdTokenChanged, GoogleAuthProvider, signInWithPopup as firebaseSignInWithPopup, signOut as firebaseSignOut, type User } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

export const clientApp: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(clientApp);
const googleProvider = new GoogleAuthProvider();


export function onAuthStateChanged(callback: (user: User | null) => void) {
  return onIdTokenChanged(auth, async (user) => {
    callback(user);
  });
}

export async function signInWithGoogle() {
  try {
    await firebaseSignInWithPopup(auth, googleProvider);
    // Reload to ensure the new auth state is picked up everywhere
    window.location.reload(); 
    return { success: true };
  } catch (error: any) {
    console.error("Google Sign-In Error:", error);
    return { success: false, error: error.message };
  }
}

export async function signOut() {
  try {
    await firebaseSignOut(auth);
    // Reload to ensure the new auth state is picked up everywhere
    window.location.reload();
    return { success: true };
  } catch (error: any)
  {
    console.error("Sign-Out Error:", error);
    return { success: false, error: error.message };
  }
}
