// This is a server-side file
'use server';

/**
 * @fileOverview Generates chord progressions for a song playing from Spotify.
 *
 * - generateChords - A function that handles the chord progression generation process.
 * - GenerateChordsInput - The input type for the generateChords function.
 * - GenerateChordsOutput - The return type for the generateChords function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateChordsInputSchema = z.object({
  songUri: z.string().describe('The Spotify URI of the song.'),
});
export type GenerateChordsInput = z.infer<typeof GenerateChordsInputSchema>;

const GenerateChordsOutputSchema = z.object({
  chordProgression: z.string().describe('The generated chord progression for the song.'),
});
export type GenerateChordsOutput = z.infer<typeof GenerateChordsOutputSchema>;

export async function generateChords(input: GenerateChordsInput): Promise<GenerateChordsOutput> {
  return generateChordsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateChordsPrompt',
  input: {schema: GenerateChordsInputSchema},
  output: {schema: GenerateChordsOutputSchema},
  prompt: `You are a musical expert and can generate chord progressions for songs.

  Generate the chord progression for the song with the following Spotify URI: {{{songUri}}}.
  Focus on aligning chords accurately to each bar, and provide the output in a readable format.
  For example: Am - G - C - F`,
});

const generateChordsFlow = ai.defineFlow(
  {
    name: 'generateChordsFlow',
    inputSchema: GenerateChordsInputSchema,
    outputSchema: GenerateChordsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
