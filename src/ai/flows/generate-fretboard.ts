
'use server';
/**
 * @fileOverview Generates a fretboard diagram for a given guitar chord.
 *
 * - generateFretboard - A function that returns the fingering for a given chord.
 * - GenerateFretboardInput - The input type for the generateFretboard function.
 * - GenerateFretboardOutput - The return type for the generateFretboard function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateFretboardInputSchema = z.object({
  chord: z.string().describe('The name of the chord, e.g., "C", "G7", "F#m", "C/G".'),
});
export type GenerateFretboardInput = z.infer<typeof GenerateFretboardInputSchema>;

const GenerateFretboardOutputSchema = z.object({
  frets: z.array(z.number()).length(6).describe('An array of 6 numbers representing the fret for each string (EADGBe). -1 for a muted string, 0 for an open string.'),
  fingers: z.array(z.number()).length(6).describe('An array of 6 numbers representing the finger to use for each string (EADGBe). 0 for open strings, 1-4 for fingers.'),
});
export type GenerateFretboardOutput = z.infer<typeof GenerateFretboardOutputSchema>;

export async function generateFretboard(input: GenerateFretboardInput): Promise<GenerateFretboardOutput> {
  return generateFretboardFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFretboardPrompt',
  input: { schema: GenerateFretboardInputSchema },
  output: { schema: GenerateFretboardOutputSchema },
  prompt: `You are an expert guitarist and music theorist. Your task is to generate the standard fingering for a given guitar chord: "{{chord}}".

Provide the fret numbers for each of the 6 strings (E, A, D, G, B, e), where -1 indicates a muted string and 0 indicates an open string.

Also provide the suggested fingers (1=index, 2=middle, 3=ring, 4=pinky) for the fretted notes. Use 0 for open strings.

Handle complex chords, including slash chords (inversions). For a slash chord like "C/G", "G" is the bass note. The lowest-pitched string played should be a G.

Example 1: For "Am", you would return:
- frets: [-1, 0, 2, 2, 1, 0]
- fingers: [0, 0, 2, 3, 1, 0]

Example 2: For "F", a barre chord, you might return:
- frets: [1, 3, 3, 2, 1, 1]
- fingers: [1, 3, 4, 2, 1, 1]

Example 3: For "G7", you would return:
- frets: [3, 2, 0, 0, 0, 1]
- fingers: [3, 2, 0, 0, 0, 1]

Example 4: For "C/G" (C major with G in the bass), you would return:
- frets: [3, 3, 2, 0, 1, 0]
- fingers: [3, 4, 2, 0, 1, 0]

Generate the simplest, most common voicing for the chord.`,
});

const generateFretboardFlow = ai.defineFlow(
  {
    name: 'generateFretboardFlow',
    inputSchema: GenerateFretboardInputSchema,
    outputSchema: GenerateFretboardOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
