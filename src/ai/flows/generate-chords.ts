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
import { getTrackDetails } from '@/services/spotify';

const GenerateChordsInputSchema = z.object({
  songUri: z.string().describe('The Spotify URI of the song, or a local file URI.'),
});
export type GenerateChordsInput = z.infer<typeof GenerateChordsInputSchema>;

const GenerateChordsOutputSchema = z.object({
  lines: z.array(z.object({
    lyrics: z.string().describe('A line of lyrics.'),
    jianpu: z.string().describe('The numbered musical notation (Jianpu) for the lyric line. Use spaces to separate notes within a measure and | to separate measures. Example: "1 2 3 4 | 5 6 5 4"'),
    measures: z.array(z.object({
      chords: z.string().describe('The chords for this measure, separated by spaces.'),
    })).describe('The measures for this line of lyrics.'),
  })).describe('The lyrics, Jianpu, and chords for the song, line by line.'),
  chordProgression: z.string().describe('The generated chord progression for the song.'),
});
export type GenerateChordsOutput = z.infer<typeof GenerateChordsOutputSchema>;

export async function generateChords(input: GenerateChordsInput): Promise<GenerateChordsOutput> {
  return generateChordsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateChordsPrompt',
  input: {schema: z.object({
    songName: z.string(),
    artistName: z.string(),
  })},
  output: {schema: GenerateChordsOutputSchema},
  prompt: `You are a musical expert and can generate chord progressions, lyrics, and numbered musical notation (Jianpu) for songs.

  Generate the Chinese lyrics, chord progression, and Jianpu for the song "{{songName}}" by "{{artistName}}".
  
  For each line of lyrics, provide:
  1. The lyric text.
  2. The corresponding Jianpu notation. Use spaces for notes within a measure and '|' to separate measures.
  3. An array of measures, with the corresponding chords for each measure.
  
  Also provide the overall chord progression as a simple string (e.g., "C - G - Am - G").
  
  Example for one line:
  - lyrics: "I see trees of green"
  - jianpu: "1 2 3 4 | 5 5 5 -"
  - measures: [{chords: "C"}, {chords: "G7"}]

  Structure the final output as an object containing 'lines' and 'chordProgression'.`,
});

const generateChordsFlow = ai.defineFlow(
  {
    name: 'generateChordsFlow',
    inputSchema: GenerateChordsInputSchema,
    outputSchema: GenerateChordsOutputSchema,
  },
  async ({ songUri }) => {
    let songName = 'Unknown Song';
    let artistName = 'Unknown Artist';

    if (songUri.startsWith('spotify:')) {
      const trackDetails = await getTrackDetails(songUri);
      if (trackDetails) {
        songName = trackDetails.name;
        artistName = trackDetails.artists.join(', ');
      } else {
        throw new Error('Could not retrieve song details from Spotify.');
      }
    } else if (songUri.startsWith('local:file:')) {
      songName = songUri.replace('local:file:', '').replace(/\.[^/.]+$/, "");
      artistName = 'Local File';
    }

    const {output} = await prompt({ songName, artistName });
    return output!;
  }
);
