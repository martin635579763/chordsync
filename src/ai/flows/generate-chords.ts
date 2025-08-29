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
  arrangementStyle: z.string().optional().describe('The desired arrangement style for the chords.'),
});
export type GenerateChordsInput = z.infer<typeof GenerateChordsInputSchema>;

const GenerateChordsOutputSchema = z.object({
  lines: z.array(z.object({
    lyrics: z.string().describe('A line of lyrics.'),
    measures: z.array(z.object({
      chords: z.string().describe('The chords for this measure, separated by spaces. Should be standard chord names (e.g., "C", "G7", "F#m", "C/G").'),
      strummingPattern: z.string().optional().describe('The suggested right-hand strumming pattern for this measure. Use "D" for downstroke and "U" for upstroke (e.g., "D DU UDU").'),
    })).describe('The measures for this line of lyrics.'),
  })).describe('The lyrics and chords for the song, line by line.'),
  uniqueChords: z.array(z.string()).describe('An array of all unique chords present in the song, in standard notation (e.g., "C", "G7", "Am").'),
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
    arrangementStyle: z.string().optional(),
  })},
  output: {schema: GenerateChordsOutputSchema},
  prompt: `You are a musical expert and can generate chord progressions, lyrics, and strumming patterns for songs.

  Generate the Chinese lyrics, a chord progression, and a right-hand strumming pattern for the song "{{songName}}" by "{{artistName}}".
  
  Please adhere to the following arrangement style: {{arrangementStyle}}.
  - If the style is 'Standard', provide the most common and straightforward chord progression.
  - If the style is 'Pop Arrangement', create a more intricate arrangement. Feel free to use techniques like slash chords (e.g., G/B) to create interesting basslines (like descending basslines), or add 7ths, 9ths, or other extensions to enrich the harmony.

  For each line of lyrics, provide:
  1. The lyric text.
  2. An array of measures, with the corresponding chords for each measure. Each chord string must be a standard, clean chord name (e.g., "C", "G7", "F#m", "C/G") without extra characters or spaces.
  3. For each measure, also provide a suggested 'strummingPattern'. Use 'D' for a downstroke and 'U' for an upstroke. For example: "D DU UDU".

  Also, provide an array of all unique chords found in the song.
  
  Example for one line:
  - lyrics: "I see trees of green"
  - measures: [{chords: "C", strummingPattern: "D DU UDU"}, {chords: "G7", strummingPattern: "D DU UDU"}]

  Structure the final output as an object containing 'lines' and 'uniqueChords'.`,
});

const generateChordsFlow = ai.defineFlow(
  {
    name: 'generateChordsFlow',
    inputSchema: GenerateChordsInputSchema,
    outputSchema: GenerateChordsOutputSchema,
  },
  async ({ songUri, arrangementStyle }) => {
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

    const {output} = await prompt({ songName, artistName, arrangementStyle: arrangementStyle || 'Standard' });
    return output!;
  }
);
