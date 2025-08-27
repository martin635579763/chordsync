'use server';

import { generateChords, GenerateChordsInput } from '@/ai/flows/generate-chords';
import { generateFretboard } from '@/ai/flows/generate-fretboard';
import { searchTracks as searchSpotifyTracks } from '@/services/spotify';
import { getCachedFretboard, setCachedFretboard } from '@/services/firebase';


export async function getChords(input: GenerateChordsInput) {
  try {
    const output = await generateChords(input);
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
