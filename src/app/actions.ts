'use server';

import { generateChords, GenerateChordsInput } from '@/ai/flows/generate-chords';
import { generateFretboard } from '@/ai/flows/generate-fretboard';
import { searchTracks as searchSpotifyTracks, getTrackDetails } from '@/services/spotify';
import { getCachedFretboard, setCachedFretboard, getCachedChords, setCachedChords, getRecentChords } from '@/services/firebase';


export async function getChords(input: GenerateChordsInput) {
  try {
    const cacheKey = `${input.songUri}${input.arrangementStyle ? `-${input.arrangementStyle}` : ''}${input.lyrics ? '-lyrics' : ''}`;
    // 1. Check cache first
    const cachedData = await getCachedChords(cacheKey);
    if (cachedData) {
      return { success: true, data: cachedData };
    }
    
    // 2. If not in cache, generate with AI
    const output = await generateChords(input);

    // 3. Store in cache for future use
    await setCachedChords(cacheKey, output, input.songUri, input.arrangementStyle || 'Standard');
    
    return { success: true, data: output };
  } catch (error) {
    console.error('Error generating chords:', error);
    return { success: false, error: 'Failed to generate chords. Please try again.' };
  }
}

export async function searchSongs(query: string) {
    if (!query) {
        return { success: true, data: [] };
    }
    try {
        const output = await searchSpotifyTracks(query);
        return { success: true, data: output };
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
    const songUris = await getRecentChords(20, arrangementStyle); // Fetch more to account for duplicates
    const uniqueSongUris = [...new Set(songUris)].slice(0, 10); // Deduplicate and limit
    
    const trackDetailsPromises = uniqueSongUris.map(uri => getTrackDetails(uri));
    const tracks = await Promise.all(
        trackDetailsPromises.map(p => p.catch(e => {
            console.error("Failed to fetch a track detail, skipping:", e);
            return null;
        }))
    );
    
    const validTracks = tracks.filter(Boolean);

    const searchResults = validTracks.map((track, index) => ({
        uri: uniqueSongUris[index],
        name: track!.name,
        artist: track!.artists.join(', '),
        art: track!.art,
        previewUrl: track!.previewUrl,
    }));

    return { success: true, data: searchResults };

  } catch (error) {
    console.error('Error fetching initial songs:', error);
    return { success: false, error: 'Failed to load initial songs.' };
  }
}
