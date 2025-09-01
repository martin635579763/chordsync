'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onIdTokenChanged, GoogleAuthProvider, signInWithPopup as firebaseSignInWithPopup, signOut as firebaseSignOut, type User } from 'firebase/auth';
import { createSession, signOut as signOutServer } from './actions';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();


export function onAuthStateChanged(callback: (user: User | null) => void) {
  return onIdTokenChanged(auth, async (user) => {
    if (user) {
      const idToken = await user.getIdToken();
      await createSession(idToken);
    } else {
      await signOutServer();
    }
    callback(user);
  });
}

export async function signInWithGoogle() {
  try {
    await firebaseSignInWithPopup(auth, googleProvider);
    return { success: true };
  } catch (error: any) {
    console.error("Google Sign-In Error:", error);
    return { success: false, error: error.message };
  }
}

export async function signOut() {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error: any) {
    console.error("Sign-Out Error:", error);
    return { success: false, error: error.message };
  }
}
