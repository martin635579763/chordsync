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
      tablature: z.array(z.string()).length(6).optional().describe('The tablature for the right hand picking/strumming pattern for this measure. It is an array of 6 strings, representing the 6 guitar strings (e, B, G, D, A, E). Use numbers for frets, "x" for muted notes, and "-" for rests. This should represent the sequence of notes being played over time. Ensure the length of each string in the array is consistent for proper formatting.'),
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
  prompt: `You are a musical expert and can generate chord progressions, lyrics, and detailed guitar tablature for songs.

  Generate the Chinese lyrics, a chord progression, and a right-hand tablature pattern for the song "{{songName}}" by "{{artistName}}".
  
  Please adhere to the following arrangement style: {{arrangementStyle}}.
  - If the style is 'Standard', provide a common and straightforward fingerpicking or strumming pattern.
  - If the style is 'Pop Arrangement', create a more intricate arrangement. Feel free to use techniques like slash chords (e.g., G/B) to create interesting basslines (like descending basslines), or add 7ths, 9ths, or other extensions to enrich the harmony. The tablature should reflect these richer patterns.

  For each line of lyrics, provide:
  1. The lyric text.
  2. An array of measures, with the corresponding chords for each measure. Each chord string must be a standard, clean chord name (e.g., "C", "G7", "F#m", "C/G").
  3. For each measure, also provide a 'tablature'. This should be an array of 6 strings, representing a standard guitar tab for the right hand. The order is e, B, G, D, A, E (high to low).
     - The tablature MUST represent the SEQUENCE of notes played over time.
     - Use numbers (0, 1, 2...) to indicate a fret to be played on a string.
     - Use 'x' to indicate a muted or percussive hit.
     - Use '-' for a rest or unplayed string.
     - For strumming, you can use 'x' on the strings to be strummed.
     - The length of each string in the tab array MUST be consistent within a single measure to ensure proper visual alignment.

  Also, provide an array of all unique chords found in the song.
  
  Example for one line with a fingerpicking pattern showing sequence:
  - lyrics: "I see trees of green"
  - measures: [
      {
        chords: "C", 
        tablature: [
          "-----0-------",
          "---1---1-----",
          "---0-----0---",
          "-----2-------",
          "-3-----------",
          "-------------"
        ]
      }, 
      {
        chords: "G7", 
        tablature: [
          "-----1-------",
          "---0---0-----",
          "---0-----0---",
          "-----0-------",
          "---2---------",
          "-3-----------"
        ]
      }
    ]

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

    // Post-processing to ensure uniqueChords are clean and derived from the measures
    if (output && output.lines) {
        const chordSet = new Set<string>();
        output.lines.forEach(line => {
            if (line.measures) {
                line.measures.forEach(measure => {
                    if(measure.chords) {
                        measure.chords.split(' ').forEach(chord => {
                            if (chord) chordSet.add(chord.trim());
                        });
                    }
                });
            }
        });
        output.uniqueChords = Array.from(chordSet);
    } else if (output) {
        // Fallback if lines are not generated, use the potentially unreliable uniqueChords from AI
        output.uniqueChords = output.uniqueChords ? [...new Set(output.uniqueChords.map(c => c.trim()).filter(Boolean))] : [];
    }
    
    return output!;
  }
);
