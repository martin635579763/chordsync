'use server';

import { generateChords, GenerateChordsInput } from '@/ai/flows/generate-chords';

export async function getChords(input: GenerateChordsInput) {
  try {
    const output = await generateChords(input);
    return { success: true, data: output };
  } catch (error) {
    console.error('Error generating chords:', error);
    return { success: false, error: 'Failed to generate chords. Please try again.' };
  }
}
