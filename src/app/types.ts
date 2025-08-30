import { z } from 'zod';

// generate-chords.ts
export const GenerateChordsOutputSchema = z.object({
  lines: z.array(z.object({
    lyrics: z.string().describe('A line of lyrics.'),
    measures: z.array(z.object({
        chords: z.string().describe('The chords for this measure, separated by spaces. Should be standard chord names (e.g., "C", "G7", "F#m", "C/G").'),
    })).describe('The measures for this line.'),
    startTime: z.number().describe('The start time of this line in seconds.'),
  })).describe('The lyrics and chords for the song, line by line.'),
  uniqueChords: z.array(z.string()).describe('An array of all unique chords present in the song, in standard notation (e.g., "C", "G7", "Am").'),
});
export type GenerateChordsOutput = z.infer<typeof GenerateChordsOutputSchema>;

export const GenerateChordsInputSchema = z.object({
  songUri: z.string().describe('The Spotify URI of the song, or a local file URI.'),
  arrangementStyle: z.string().optional().describe('The desired arrangement style for the chords.'),
});
export type GenerateChordsInput = z.infer<typeof GenerateChordsInputSchema>;


// generate-fretboard.ts
export const GenerateFretboardOutputSchema = z.object({
  frets: z.array(z.number()).length(6).describe('An array of 6 numbers representing the fret for each string (EADGBe). -1 for a muted string, 0 for an open string.'),
  fingers: z.array(z.number()).length(6).describe('An array of 6 numbers representing the finger to use for each string (EADGBe). 0 for open strings, 1-4 for fingers.'),
});
export type GenerateFretboardOutput = z.infer<typeof GenerateFretboardOutputSchema>;

export const GenerateFretboardInputSchema = z.object({
  chord: z.string().describe('The name of the chord, e.g., "C", "G7", "F#m", "C/G".'),
});
export type GenerateFretboardInput = z.infer<typeof GenerateFretboardInputSchema>;


// generate-accompaniment-text.ts / actions.ts
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

```