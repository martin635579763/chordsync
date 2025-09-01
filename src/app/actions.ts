
'use server';

import { generateChords } from '@/ai/flows/generate-chords';
import { generateFretboard } from '@/ai/flows/generate-fretboard';
import { generateAccompanimentText } from '@/ai/flows/generate-accompaniment-text';
import { searchTracks as searchSpotifyTracks, getTrackDetails } from '@/services/spotify';
import { searchYouTubeVideo } from '@/services/youtube';
import { 
  getCachedFretboard, 
  setCachedFretboard, 
  getCachedChords, 
  setCachedChords, 
  getRecentChords, 
  checkChordCacheExists, 
  deleteCachedChords as deleteChordsFromDb,
  getCachedAccompanimentText,
  setCachedAccompanimentText
} from '@/services/firebase';
import type { GenerateChordsInput, GenerateChordsOutput, GenerateFretboardOutput, GenerateAccompanimentTextInput, GenerateAccompanimentTextOutput } from '@/app/types';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/app/auth/firebase-admin';


export async function getChords(input: GenerateChordsInput, forceNew: boolean = false) {
  try {
    if (forceNew) {
        try {
            const adminApp = getAdminApp();
            const sessionCookie = cookies().get('session')?.value;
            if (!sessionCookie) {
                 return { success: false, error: 'Unauthorized: Missing session cookie.' };
            }

            const decodedClaims = await getAuth(adminApp).verifySessionCookie(sessionCookie, true);
            if (decodedClaims.email !== 'zhungmartin@gmail.com') {
                 return { success: false, error: 'Unauthorized: Only admins can force-regenerate chords.' };
            }
        } catch (error) {
            console.error("Admin check failed:", error);
            return { success: false, error: 'Unauthorized: Could not verify admin status.' };
        }
    }

    const cacheKey = `${input.songUri}${input.arrangementStyle ? `-${input.arrangementStyle}` : ''}`;
    
    if (!forceNew) {
      const cachedData = await getCachedChords(cacheKey);
      if (cachedData) {
        return { success: true, data: cachedData };
      }
    }
    
    const output = await generateChords(input);

    if (input.songUri.startsWith('spotify:')) {
        await setCachedChords(cacheKey, output, input.songUri, input.arrangementStyle || 'Standard');
    }
    
    return { success: true, data: output };
  } catch (error) {
    console.error('Error generating chords:', error);
    return { success: false, error: 'Failed to generate chords. Please try again.' };
  }
}

export async function searchSongs(query: string, arrangementStyle: string) {
    if (!query) {
        return { success: true, data: [] };
    }
    try {
        const spotifyTracks = await searchSpotifyTracks(query);
        
        const resultsWithCacheStatus = await Promise.all(
            spotifyTracks.map(async (track) => {
                const cacheKey = `${track.uri}${arrangementStyle ? `-${arrangementStyle}` : ''}`;
                const isGenerated = await checkChordCacheExists(cacheKey);
                return {
                    ...track,
                    isGenerated,
                };
            })
        );

        return { success: true, data: resultsWithCacheStatus };
    } catch (error) {
        console.error('Error searching songs:', error);
        return { success: false, error: 'Failed to search for songs. Please try again.'};
    }
}

export async function getFretboard(chord: string): Promise<{ success: boolean; data?: GenerateFretboardOutput; error?: string; }> {
  try {
    const cachedData = await getCachedFretboard(chord);
    if (cachedData) {
      return { success: true, data: cachedData };
    }

    const output = await generateFretboard({ chord });
    
    await setCachedFretboard(chord, output);

    return { success: true, data: output };
  } catch (error)
  {
    console.error(`Error generating fretboard for ${chord}:`, error);
    return { success: false, error: 'Failed to generate fretboard diagram.' };
  }
}

export async function getInitialSongs(arrangementStyle: string) {
  try {
    const recentSongs = await getRecentChords(50);
    
    const styleMatchingSongs = recentSongs.filter(song => song.arrangementStyle === (arrangementStyle || 'Standard'));

    const uniqueSongUris = [...new Set(styleMatchingSongs.map(s => s.songUri))].slice(0, 10);
    
    const trackDetailsPromises = uniqueSongUris.map(uri => getTrackDetails(uri));
    const tracks = await Promise.all(
        trackDetailsPromises.map(p => p.catch(e => {
            console.error("Failed to fetch a track detail, skipping:", e);
            return null;
        }))
    );
    
    const validTracks = tracks.filter(Boolean);

    const searchResults = validTracks.map((track) => ({
        uri: track!.uri,
        name: track!.name,
        artist: track!.artists.join(', '),
        art: track!.art,
        previewUrl: track!.previewUrl,
        isGenerated: true,
    }));
    
    return { success: true, data: searchResults };

  } catch (error) {
    console.error('Error fetching initial songs:', error);
    return { success: false, error: 'Failed to load initial songs.' };
  }
}

export async function deleteChords(songUri: string, arrangementStyle: string) {
  try {
    const adminApp = getAdminApp();
    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) {
        return { success: false, error: 'Unauthorized' };
    }
    const decodedClaims = await getAuth(adminApp).verifySessionCookie(sessionCookie, true);
    if (decodedClaims.email !== 'zhungmartin@gmail.com') {
        return { success: false, error: 'Unauthorized' };
    }

    const cacheKey = `${songUri}${arrangementStyle ? `-${arrangementStyle}` : ''}`;
    await deleteChordsFromDb(cacheKey);
    return { success: true };
  } catch (error) {
    console.error('Error deleting chords:', error);
    return { success: false, error: 'Failed to delete chords. Please try again.' };
  }
}

export async function getAccompanimentText(input: GenerateAccompanimentTextInput): Promise<{ success: boolean; data?: GenerateAccompanimentTextOutput; error?: string; }> {
  try {
    const cacheKey = `${input.chords.uniqueChords.join('-')}-${input.arrangementStyle || 'Standard'}`;
    
    const cachedData = await getCachedAccompanimentText(cacheKey);
    if (cachedData) {
      return { success: true, data: cachedData };
    }

    const output = await generateAccompanimentText(input);
    
    await setCachedAccompanimentText(cacheKey, output);

    return { success: true, data: output };

  } catch (error) {
    console.error('Error generating accompaniment text:', error);
    return { success: false, error: 'Failed to get playing suggestions. Please try again.' };
  }
}

export async function getYouTubeVideoId(songName: string, artistName: string): Promise<{ success: boolean; videoId?: string; error?: string; }> {
  try {
    const query = `${songName} ${artistName} official audio`;
    const videoId = await searchYouTubeVideo(query);
    if (videoId) {
      return { success: true, videoId };
    } else {
      return { success: false, error: 'Could not find a matching video on YouTube.' };
    }
  } catch (error) {
    console.error('Error searching YouTube video:', error);
    return { success: false, error: 'An error occurred while searching for a video.' };
  }
}
