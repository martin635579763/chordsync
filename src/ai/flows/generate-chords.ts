
// This is a server-side file
'use server';

/**
 * @fileOverview Generates chord progressions for a song playing from Spotify.
 *
 * - generateChords - A function that handles the chord progression generation process.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getTrackDetails } from '@/services/spotify';
import type { GenerateChordsInput, GenerateChordsOutput } from '@/app/types';

const GenerateChordsInputSchema = z.object({
  songUri: z.string().describe('The Spotify URI of the song, or a local file URI.'),
  arrangementStyle: z.string().optional().describe('The desired arrangement style for the chords.'),
});

// THIS is the part that was out of sync. It now matches types.ts
const GenerateChordsOutputSchema = z.object({
  lines: z.array(z.object({
    lyrics: z.string().describe('A line of lyrics.'),
    measures: z.array(z.object({
      chords: z.string().describe('The chords for this measure, separated by spaces. Should be standard chord names (e.g., "C", "G7", "F#m", "C/G").'),
      startTime: z.number().describe('The start time of this measure in seconds from the beginning of the song.'),
    })).describe('The measures of chords for this line, with a timestamp for each measure.'),
    startTime: z.number().describe('The start time of this line in seconds from the beginning of the song.'),
  })).describe('The lyrics and chords for the song, line by line, with measures and timestamps.'),
  uniqueChords: z.array(z.string()).describe('An array of all unique chords present in the song, in standard notation (e.g., "C", "G7", "Am").'),
});


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
  prompt: `You are a musical expert and your task is to generate a chord progression with REAL lyrics, measures, and precise timestamps for a given song.

  Generate the chords, lyrics, and start times for "{{songName}}" by "{{artistName}}".
  
  Please adhere to the following arrangement style: {{arrangementStyle}}.
  - If the style is 'Pop Arrangement', create a more intricate arrangement. Feel free to use techniques like slash chords (e.g., G/B) to create interesting basslines, or add 7ths, 9ths, or other extensions.

  For each line of the song, provide:
  1. The lyrics for that line.
  2. The exact start time of that line in seconds (as a number), named 'startTime'.
  3. A 'measures' array containing the chords for that line, broken down into measures.
  
  For EACH measure in the 'measures' array, you MUST provide:
  1. The chords for that measure (e.g., "C", "G Am").
  2. The exact start time of THAT MEASURE in seconds (as a number), also named 'startTime'. This is critical for synchronization.

  Also, provide an array of all unique chords found in the song.
  
  IMPORTANT: You must generate chords for the entire song structure using the REAL LYRICS. Do not leave out any data. The lyrics, measures, and all timestamps are crucial.

  Example for one line:
  {
    "lyrics": "I found a love for me",
    "startTime": 15.5,
    "measures": [ 
      { "chords": "C", "startTime": 15.5 }, 
      { "chords": "G", "startTime": 17.0 }, 
      { "chords": "Am", "startTime": 18.5 },
      { "chords": "F", "startTime": 20.0 }
    ]
  }

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

    const {output} = await prompt({ songName, artistName, arrangementStyle: arrangementStyle || 'Pop Arrangement' });

    // Post-processing to ensure uniqueChords are clean and derived from the measures
    if (output && output.lines) {
        const chordSet = new Set<string>();
        output.lines.forEach(line => {
            line.measures.forEach(measure => {
                if (measure.chords) {
                    measure.chords.split(' ').forEach(chord => {
                        if (chord) chordSet.add(chord.trim());
                    });
                }
            });
        });
        output.uniqueChords = Array.from(chordSet);
    } else if (output) {
        // Fallback if lines are not generated, use the potentially unreliable uniqueChords from AI
        output.uniqueChords = output.uniqueChords ? [...new Set(output.uniqueChords.map(c => c.trim()).filter(Boolean))] : [];
    }
    
    return output!;
  }
);

