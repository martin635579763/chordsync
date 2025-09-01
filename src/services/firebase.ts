
'use server';

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, limit, query, orderBy, where, deleteDoc } from 'firebase/firestore';
import type { GenerateFretboardOutput, GenerateChordsOutput, GenerateAccompanimentTextOutput } from '@/app/types';
import { getTrackDetails } from '@/services/spotify';

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
const accompanimentCacheCollection = 'accompanimentCache';


// Firestore document IDs cannot contain slashes or be empty.
function sanitizeDocId(id: string): string {
    return id.replace(/[\/:]/g, '-');
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

export async function getCachedChords(cacheKey: string): Promise<GenerateChordsOutput | null> {
  const docId = sanitizeDocId(cacheKey);
  try {
    const docRef = doc(db, chordCacheCollection, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log(`[Firestore] Cache hit for song: ${cacheKey} (docId: ${docId})`);
      const data = docSnap.data();
      // Firestore Timestamps are not plain objects and cannot be passed from Server to Client Components.
      // We don't need it on the client, so we can just delete it.
      delete data.timestamp;
      return data as GenerateChordsOutput;
    } else {
      console.log(`[Firestore] Cache miss for song: ${cacheKey} (docId: ${docId})`);
      return null;
    }
  } catch (error) {
    console.error(`[Firestore] Error getting cached chords for ${cacheKey} (docId: ${docId}):`, error);
    return null;
  }
}

export async function checkChordCacheExists(cacheKey: string): Promise<boolean> {
  const docId = sanitizeDocId(cacheKey);
  try {
    const docRef = doc(db, chordCacheCollection, docId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.error(`[Firestore] Error checking cache for ${cacheKey} (docId: ${docId}):`, error);
    return false;
  }
}


export async function setCachedChords(cacheKey: string, data: GenerateChordsOutput, songUri: string, arrangementStyle: string): Promise<void> {
  const docId = sanitizeDocId(cacheKey);
  try {
    const docRef = doc(db, chordCacheCollection, docId);
    
    const trackDetails = await getTrackDetails(songUri);
    const searchTerms = trackDetails ? [trackDetails.name.toLowerCase(), ...trackDetails.artists.map(a => a.toLowerCase())] : [];

    await setDoc(docRef, {...data, songUri, arrangementStyle, timestamp: new Date(), searchTerms });
    console.log(`[Firestore] Successfully cached chords for song: ${cacheKey} (docId: ${docId})`);
  } catch (error) {
    console.error(`[Firestore] Error setting cached chords for ${cacheKey} (docId: ${docId}):`, error);
  }
}

export async function deleteCachedChords(cacheKey: string): Promise<void> {
    const docId = sanitizeDocId(cacheKey);
    try {
        const docRef = doc(db, chordCacheCollection, docId);
        await deleteDoc(docRef);
        console.log(`[Firestore] Successfully deleted cached chords for: ${cacheKey} (docId: ${docId})`);
    } catch (error) {
        console.error(`[Firestore] Error deleting cached chords for ${cacheKey} (docId: ${docId}):`, error);
        throw error; // Re-throw to be caught by the server action
    }
}


export async function getRecentChords(count: number): Promise<{ songUri: string, arrangementStyle: string }[]> {
    try {
        const q = query(
            collection(db, chordCacheCollection), 
            orderBy("timestamp", "desc"), 
            limit(count)
        );
        const querySnapshot = await getDocs(q);
        const songs = querySnapshot.docs
            .map(doc => doc.data())
            .filter(data => data.songUri && data.arrangementStyle)
            .map(data => ({ songUri: data.songUri, arrangementStyle: data.arrangementStyle }));

        console.log(`[Firestore] Fetched ${songs.length} recent songs.`);
        return songs;
    } catch (error) {
        console.error(`[Firestore] Error fetching recent chords:`, error);
        return [];
    }
}

export async function getCachedAccompanimentText(cacheKey: string): Promise<GenerateAccompanimentTextOutput | null> {
  const docId = sanitizeDocId(cacheKey);
  try {
    const docRef = doc(db, accompanimentCacheCollection, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as GenerateAccompanimentTextOutput;
    }
    return null;
  } catch (error) {
    console.error(`[Firestore] Error getting cached accompaniment text for ${docId}:`, error);
    return null;
  }
}

export async function setCachedAccompanimentText(cacheKey: string, data: GenerateAccompanimentTextOutput): Promise<void> {
  const docId = sanitizeDocId(cacheKey);
  try {
    const docRef = doc(db, accompanimentCacheCollection, docId);
    await setDoc(docRef, data);
  } catch (error) {
    console.error(`[Firestore] Error setting cached accompaniment text for ${docId}:`, error);
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

export async function searchCachedChords(searchQuery: string) {
    try {
        const q = query(
            collection(db, chordCacheCollection),
            where('searchTerms', 'array-contains', searchQuery.toLowerCase())
        );

        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return [];
        }

        const songUris = querySnapshot.docs.map(doc => doc.data().songUri);
        const uniqueSongUris = [...new Set(songUris)];

        const trackDetailsPromises = uniqueSongUris.map(uri => getTrackDetails(uri));
        const tracks = await Promise.all(
             trackDetailsPromises.map(p => p.catch(e => {
                console.error("Failed to fetch a track detail during search, skipping:", e);
                return null;
            }))
        );

        return tracks.filter(Boolean).map(track => ({
            uri: track!.uri,
            name: track!.name,
            artist: track!.artists.join(', '),
            art: track!.art,
            previewUrl: track!.previewUrl,
        }));

    } catch (error) {
        console.error('[Firestore] Error searching cached chords:', error);
        return [];
    }
}
