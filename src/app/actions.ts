
'use server';

import { generateChords, GenerateChordsInput } from '@/ai/flows/generate-chords';
import { generateFretboard } from '@/ai/flows/generate-fretboard';
import { generateAccompanimentText, GenerateAccompanimentTextInput } from '@/ai/flows/generate-accompaniment-text';
import { searchTracks as searchSpotifyTracks, getTrackDetails } from '@/services/spotify';
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


export async function getChords(input: GenerateChordsInput, forceNew: boolean = false) {
  try {
    const cacheKey = `${input.songUri}${input.arrangementStyle ? `-${input.arrangementStyle}` : ''}`;
    
    // 1. Check cache first, unless forcing a new generation
    if (!forceNew) {
      const cachedData = await getCachedChords(cacheKey);
      if (cachedData) {
        return { success: true, data: cachedData };
      }
    }
    
    // 2. If not in cache or forceNew is true, generate with AI
    const output = await generateChords(input);

    // 3. Store in cache for future use
    if (input.songUri.startsWith('spotify:')) { // Only cache spotify songs
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
                const cacheKey = `${track.uri}-${arrangementStyle}`;
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

export async function getFretboard(chord: string) {
  try {
    // 1. Check cache first
    const cachedData = await getCachedFretboard(chord);
    if (cachedData) {
      return { success: true, data: cachedData };
    }

    // 2. If not in cache, generate with AI
    const output = await generateFretboard({ chord });
    
    // 3. Store in cache for future use
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
    
    const styleMatchingSongs = recentSongs.filter(song => song.arrangementStyle === arrangementStyle);

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
    const cacheKey = `${songUri}-${arrangementStyle}`;
    await deleteChordsFromDb(cacheKey);
    return { success: true };
  } catch (error) {
    console.error('Error deleting chords:', error);
    return { success: false, error: 'Failed to delete chords. Please try again.' };
  }
}

export async function getAccompanimentText(input: GenerateAccompanimentTextInput) {
  try {
    const cacheKey = `${input.chords.uniqueChords.join('-')}-${input.arrangementStyle}`;
    
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
