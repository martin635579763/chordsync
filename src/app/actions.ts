'use server';

import { generateChords, GenerateChordsInput } from '@/ai/flows/generate-chords';
import { searchTracks as searchSpotifyTracks } from '@/services/spotify';

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
