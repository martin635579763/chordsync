
'use server';

/**
 * @fileOverview Generates a guitar accompaniment audio file from a chord progression.
 *
 * - generateAccompaniment - A function that handles the audio generation process.
 * - GenerateAccompanimentInput - The input type for the generateAccompaniment function.
 * - GenerateAccompanimentOutput - The return type for the generateAccompaniment function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'genkit';
import wav from 'wav';
import type { GenerateChordsOutput } from './generate-chords';

const GenerateAccompanimentInputSchema = z.object({
  chordData: z.any().describe("The chord progression data, including lines of lyrics and measures with chords."),
});
export type GenerateAccompanimentInput = z.infer<typeof GenerateAccompanimentInputSchema>;

const GenerateAccompanimentOutputSchema = z.object({
  audioDataUri: z.string().describe("The generated audio as a base64-encoded WAV data URI."),
});
export type GenerateAccompanimentOutput = z.infer<typeof GenerateAccompanimentOutputSchema>;

export async function generateAccompaniment(input: GenerateAccompanimentInput): Promise<GenerateAccompanimentOutput> {
  return generateAccompanimentFlow(input);
}

// Helper to convert PCM buffer to WAV base64 string
async function toWav(pcmData: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels: 1,
      sampleRate: 24000,
      bitDepth: 16,
    });
    const chunks: Buffer[] = [];
    writer.on('data', chunk => chunks.push(chunk));
    writer.on('end', () => resolve(Buffer.concat(chunks).toString('base64')));
    writer.on('error', reject);
    writer.write(pcmData);
    writer.end();
  });
}

const generateAccompanimentFlow = ai.defineFlow(
  {
    name: 'generateAccompanimentFlow',
    inputSchema: GenerateAccompanimentInputSchema,
    outputSchema: GenerateAccompanimentOutputSchema,
  },
  async ({ chordData }: { chordData: GenerateChordsOutput }) => {
    // Construct a simplified prompt for the TTS model
    let promptText = "Speaker1: ";
    promptText += chordData.lines.map(line => 
      line.measures.map(measure => measure.chords).join(' ')
    ).join(' ... ');
    
    promptText = promptText.replace(/\s+/g, ' ').trim();

    if (!promptText || promptText === "Speaker1:") {
      throw new Error("Cannot generate accompaniment for empty chord data.");
    }
    
    // Generate audio using the TTS model
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      prompt: promptText,
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'riff-medium-intertwine-user-generated-4' }, // A voice that might sound somewhat instrumental
            },
        },
      },
    });

    if (!media?.url) {
      throw new Error('Audio generation failed, no media returned.');
    }

    const pcmBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
    const wavBase64 = await toWav(pcmBuffer);

    return {
      audioDataUri: `data:audio/wav;base64,${wavBase64}`,
    };
  }
);
