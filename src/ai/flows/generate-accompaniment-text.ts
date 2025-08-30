
'use server';
/**
 * @fileOverview Generates textual guitar accompaniment suggestions.
 *
 * - generateAccompanimentText - A function that returns playing suggestions.
 * - GenerateAccompanimentTextInput - The input type.
 * - GenerateAccompanimentTextOutput - The return type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { GenerateChordsOutput } from './generate-chords';

export const GenerateAccompanimentTextInputSchema = z.object({
  songName: z.string().describe('The name of the song.'),
  artistName: z.string().describe('The name of the artist.'),
  chords: z.custom<GenerateChordsOutput>().describe('The chord progression and lyrics object.'),
  arrangementStyle: z.string().optional().describe('The desired arrangement style.'),
});
export type GenerateAccompanimentTextInput = z.infer<typeof GenerateAccompanimentTextInputSchema>;

export const GenerateAccompanimentTextOutputSchema = z.object({
  playingStyleSuggestion: z.string().describe("A suggestion for the overall playing style, including dynamics and feel."),
  strummingPattern: z.string().describe("A suggested strumming pattern in a 'D DU UDU' format, where D=Down, U=Up. Include a simple text-based diagram if possible."),
  advancedTechniques: z.string().optional().describe("Suggestions for advanced techniques like palm muting, hammer-ons, or specific picking patterns for different sections (verse, chorus)."),
});
export type GenerateAccompanimentTextOutput = z.infer<typeof GenerateAccompanimentTextOutputSchema>;


export async function generateAccompanimentText(input: GenerateAccompanimentTextInput): Promise<GenerateAccompanimentTextOutput> {
  return generateAccompanimentTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAccompanimentTextPrompt',
  input: { schema: z.object({
      songName: z.string(),
      artistName: z.string(),
      chordProgression: z.string(),
      arrangementStyle: z.string().optional(),
  })},
  output: { schema: GenerateAccompanimentTextOutputSchema },
  prompt: `You are an expert guitar instructor. For the song "{{songName}}" by "{{artistName}}", which has the following chord progression:

{{chordProgression}}

Your task is to provide practical and creative guitar accompaniment advice based on the arrangement style: "{{arrangementStyle}}".

1.  **Playing Style:** Describe the overall feel. Should it be gentle, energetic, driving? Mention dynamics (e.g., "start soft in the verses, build up to the chorus").
2.  **Strumming Pattern:** Provide a versatile and common strumming pattern that fits the song. Use a format like "D DU UDU" (D=Down, U=Up). Keep it simple and effective.
3.  **Advanced Techniques (Optional):** If the style is 'Pop Arrangement', suggest more advanced embellishments. For example, mention where to use palm muting, suggest a simple fingerpicking pattern for the verse, or recommend adding hammer-ons to a specific chord change to make it more interesting.

Be concise, clear, and encouraging. The goal is to give a guitarist actionable ideas to make the song their own.
`,
});

const generateAccompanimentTextFlow = ai.defineFlow(
  {
    name: 'generateAccompanimentTextFlow',
    inputSchema: GenerateAccompanimentTextInputSchema,
    outputSchema: GenerateAccompanimentTextOutputSchema,
  },
  async ({ songName, artistName, chords, arrangementStyle }) => {
    
    // Convert chord data to a simple string for the prompt
    const chordProgression = chords.lines.map(line => 
        line.measures.map(m => m.chords).join(' | ')
    ).join('\n');

    const { output } = await prompt({
        songName,
        artistName,
        chordProgression,
        arrangementStyle: arrangementStyle || 'Standard'
    });
    
    return output!;
  }
);
