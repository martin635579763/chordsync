
'use server';

import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { 
  getFirestore as getClientFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  limit, 
  query, 
  orderBy, 
  where, 
  deleteDoc,
  type Firestore
} from 'firebase/firestore';
import type { GenerateFretboardOutput, GenerateChordsOutput, GenerateAccompanimentTextOutput } from '@/app/types';
import { getTrackDetails } from '@/services/spotify';

// This file no longer uses the Admin SDK.
// All database operations are performed using the client SDK.
// Write/delete operations will be subject to Firestore Security Rules.

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_C_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};


let clientApp: FirebaseApp;
if (!getApps().length) {
  clientApp = initializeApp(firebaseConfig);
} else {
  clientApp = getApp();
}

const clientDb = getClientFirestore(clientApp);


const fretboardCacheCollection = 'fretboardCache';
const chordCacheCollection = 'chordCache';
const accompanimentCacheCollection = 'accompanimentCache';


function sanitizeDocId(id: string): string {
    return id.replace(/[\/:]/g, '-');
}

export async function getCachedFretboard(chord: string): Promise<GenerateFretboardOutput | null> {
  const docId = sanitizeDocId(chord);
  try {
    const docRef = doc(clientDb, fretboardCacheCollection, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as GenerateFretboardOutput;
    } else {
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
    const docRef = doc(clientDb, fretboardCacheCollection, docId);
    await setDoc(docRef, data);
  } catch (error) {
    console.error(`[Firestore] Error setting cached fretboard for ${chord} (docId: ${docId}):`, error);
  }
}

export async function getCachedChords(cacheKey: string): Promise<GenerateChordsOutput | null> {
  const docId = sanitizeDocId(cacheKey);
  try {
    const docRef = doc(clientDb, chordCacheCollection, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.timestamp) {
        delete data.timestamp;
      }
      return data as GenerateChordsOutput;
    } else {
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
    const docRef = doc(clientDb, chordCacheCollection, docId);
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
    const docRef = doc(clientDb, chordCacheCollection, docId);
    
    const trackDetails = await getTrackDetails(songUri);
    const searchTerms = trackDetails ? [trackDetails.name.toLowerCase(), ...trackDetails.artists.map(a => a.toLowerCase())] : [];

    await setDoc(docRef, {...data, songUri, arrangementStyle, timestamp: new Date(), searchTerms });
  } catch (error) {
    console.error(`[Firestore] Error setting cached chords for ${cacheKey} (docId: ${docId}):`, error);
  }
}

export async function deleteChordsFromDb(cacheKey: string): Promise<void> {
    const docId = sanitizeDocId(cacheKey);
    try {
        const docRef = doc(clientDb, chordCacheCollection, docId);
        await deleteDoc(docRef);
    } catch (error) {
        console.error(`[Firestore] Error deleting cached chords for ${cacheKey} (docId: ${docId}):`, error);
        throw error; 
    }
}


export async function getRecentChords(count: number): Promise<{ songUri: string, arrangementStyle: string }[]> {
    try {
        const q = query(
            collection(clientDb, chordCacheCollection), 
            orderBy("timestamp", "desc"), 
            limit(count)
        );
        const querySnapshot = await getDocs(q);
        const songs = querySnapshot.docs
            .map(doc => doc.data())
            .filter(data => data.songUri && data.arrangementStyle)
            .map(data => ({ songUri: data.songUri, arrangementStyle: data.arrangementStyle }));

        return songs;
    } catch (error) {
        console.error(`[Firestore] Error fetching recent chords:`, error);
        return [];
    }
}

export async function getCachedAccompanimentText(cacheKey: string): Promise<GenerateAccompanimentTextOutput | null> {
  const docId = sanitizeDocId(cacheKey);
  try {
    const docRef = doc(clientDb, accompanimentCacheCollection, docId);
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
    const docRef = doc(clientDb, accompanimentCacheCollection, docId);
    await setDoc(docRef, data);
  } catch (error) {
    console.error(`[Firestore] Error setting cached accompaniment text for ${docId}:`, error);
  }
}

export async function searchCachedChords(searchQuery: string) {
    try {
        const q = query(
            collection(clientDb, chordCacheCollection),
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
