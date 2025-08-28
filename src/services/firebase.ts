
'use server';

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, limit, query } from 'firebase/firestore';
import type { GenerateFretboardOutput } from '@/ai/flows/generate-fretboard';
import type { GenerateChordsOutput } from '@/ai/flows/generate-chords';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_C_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};


let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);

const fretboardCacheCollection = 'fretboardCache';
const chordCacheCollection = 'chordCache';


export async function getCachedFretboard(chord: string): Promise<GenerateFretboardOutput | null> {
  try {
    const docRef = doc(db, fretboardCacheCollection, chord);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log(`[Firestore] Cache hit for chord: ${chord}`);
      return docSnap.data() as GenerateFretboardOutput;
    } else {
      console.log(`[Firestore] Cache miss for chord: ${chord}`);
      return null;
    }
  } catch (error) {
    console.error(`[Firestore] Error getting cached fretboard for ${chord}:`, error);
    return null;
  }
}

export async function setCachedFretboard(chord: string, data: GenerateFretboardOutput): Promise<void> {
  try {
    const docRef = doc(db, fretboardCacheCollection, chord);
    await setDoc(docRef, data);
    console.log(`[Firestore] Successfully cached fretboard for chord: ${chord}`);
  } catch (error) {
    console.error(`[Firestore] Error setting cached fretboard for ${chord}:`, error);
  }
}

export async function getCachedChords(songUri: string): Promise<GenerateChordsOutput | null> {
  try {
    const docRef = doc(db, chordCacheCollection, songUri);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log(`[Firestore] Cache hit for song: ${songUri}`);
      return docSnap.data() as GenerateChordsOutput;
    } else {
      console.log(`[Firestore] Cache miss for song: ${songUri}`);
      return null;
    }
  } catch (error) {
    console.error(`[Firestore] Error getting cached chords for ${songUri}:`, error);
    return null;
  }
}

export async function setCachedChords(songUri: string, data: GenerateChordsOutput): Promise<void> {
  try {
    const docRef = doc(db, chordCacheCollection, songUri);
    await setDoc(docRef, data);
    console.log(`[Firestore] Successfully cached chords for song: ${songUri}`);
  } catch (error) {
    console.error(`[Firestore] Error setting cached chords for ${songUri}:`, error);
  }
}


// Check if Firestore is connected by trying to read a document.
export async function checkFirestoreConnection() {
    try {
        const q = query(collection(db, fretboardCacheCollection), limit(1));
        await getDocs(q);
        console.log('[Firestore] Connection successful.');
        return true;
    } catch (error) {
        console.error('[Firestore] Connection failed:', error);
        return false;
    }
}
