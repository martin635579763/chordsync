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
  lines: z.array(z.object({
    lyrics: z.string().describe('A line of lyrics.'),
    measures: z.array(z.object({
      chords: z.string().describe('The chords for this measure, separated by spaces.'),
    })).describe('The measures for this line of lyrics.'),
  })).describe('The lyrics and chords for the song, line by line.'),
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
  prompt: `You are a musical expert and can generate chord progressions with lyrics for songs.

  Generate the Chinese lyrics and chord progression for the song with the following Spotify URI: {{{songUri}}}.
  Provide the lyrics and align the chords to each measure for each line of lyrics.
  Also provide the overall chord progression as a simple string.
  For example, a line might be:
  Lyric: "I see trees of green"
  Measures: [{chords: "C G"}, {chords: "Am G"}]
  
  The overall progression would be a summary like: C - G - Am - G - F - C - etc.
  
  Structure the output as an array of lines, where each line has the lyric text and a corresponding array of measures with chords.`,
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
