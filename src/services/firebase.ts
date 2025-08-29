
'use server';

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, limit, query, orderBy } from 'firebase/firestore';
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

// Firestore document IDs cannot contain slashes or be empty.
function sanitizeDocId(id: string): string {
    return id.replace(/\//g, '-').replace(/:/g, '-');
}

export async function getCachedFretboard(chord: string): Promise<GenerateFretboardOutput | null> {
  const docId = sanitizeDocId(chord);
  try {
    const docRef = doc(db, fretboardCacheCollection, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log(`[Firestore] Cache hit for chord: ${chord} (docId: ${docId})`);
      return docSnap.data() as GenerateFretboardOutput;
    } else {
      console.log(`[Firestore] Cache miss for chord: ${chord} (docId: ${docId})`);
      return null;
    }
  } catch (error) {
    console.error(`[Firestore] Error getting cached fretboard for ${chord} (docId: ${docId}):`, error);
    return null;
  }
}

export async function setCachedFretboard(chord: string, data: GenerateFretboardOutput): Promise<void> {
  const docId = sanitizeDocId(chord);
  try {
    const docRef = doc(db, fretboardCacheCollection, docId);
    await setDoc(docRef, data);
    console.log(`[Firestore] Successfully cached fretboard for chord: ${chord} (docId: ${docId})`);
  } catch (error) {
    console.error(`[Firestore] Error setting cached fretboard for ${chord} (docId: ${docId}):`, error);
  }
}

export async function getCachedChords(songUri: string): Promise<GenerateChordsOutput | null> {
  const docId = sanitizeDocId(songUri);
  try {
    const docRef = doc(db, chordCacheCollection, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log(`[Firestore] Cache hit for song: ${songUri} (docId: ${docId})`);
      return docSnap.data() as GenerateChordsOutput;
    } else {
      console.log(`[Firestore] Cache miss for song: ${songUri} (docId: ${docId})`);
      return null;
    }
  } catch (error) {
    console.error(`[Firestore] Error getting cached chords for ${songUri} (docId: ${docId}):`, error);
    return null;
  }
}

export async function setCachedChords(songUri: string, data: GenerateChordsOutput): Promise<void> {
  const docId = sanitizeDocId(songUri);
  try {
    const docRef = doc(db, chordCacheCollection, docId);
    await setDoc(docRef, {...data, originalUri: songUri, timestamp: new Date()});
    console.log(`[Firestore] Successfully cached chords for song: ${songUri} (docId: ${docId})`);
  } catch (error) {
    console.error(`[Firestore] Error setting cached chords for ${songUri} (docId: ${docId}):`, error);
  }
}

export async function getRecentChords(count: number): Promise<string[]> {
    try {
        const q = query(collection(db, chordCacheCollection), orderBy("timestamp", "desc"), limit(count));
        const querySnapshot = await getDocs(q);
        const songUris = querySnapshot.docs.map(doc => doc.data().originalUri).filter(Boolean);
        console.log(`[Firestore] Fetched ${songUris.length} recent song URIs.`);
        return songUris;
    } catch (error) {
        console.error(`[Firestore] Error fetching recent chords:`, error);
        return [];
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
