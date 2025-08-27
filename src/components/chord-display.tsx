'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Music, Settings } from 'lucide-react';

interface ChordDisplayProps {
  chords: string | null;
  isLoading: boolean;
  currentSong: { name: string; artist: string; art: string } | null;
}

const romanNumeralMap: { [key: string]: string } = {
  'C': 'I', 'Cm': 'i', 'Cmaj7': 'Imaj7',
  'C#': 'I#', 'C#m': 'i#', 'Db': 'IIb', 'Dbm': 'iib',
  'D': 'II', 'Dm': 'ii', 'Dmaj7': 'IImaj7',
  'D#': 'II#', 'D#m': 'ii#', 'Eb': 'IIIb', 'Ebm': 'iiib',
  'E': 'III', 'Em': 'iii', 'Emaj7': 'IIImaj7',
  'F': 'IV', 'Fm': 'iv', 'Fmaj7': 'IVmaj7',
  'F#': 'IV#', 'F#m': 'iv#', 'Gb': 'Vb', 'Gbm': 'vb',
  'G': 'V', 'Gm': 'v', 'Gmaj7': 'Vmaj7',
  'G#': 'V#', 'G#m': 'v#', 'Ab': 'VIb', 'Abm': 'vib',
  'A': 'VI', 'Am': 'vi', 'Amaj7': 'VImaj7',
  'A#': 'VI#', 'A#m': 'vi#', 'Bb': 'VIIb', 'Bbm': 'viib',
  'B': 'VII', 'Bm': 'vii', 'Bmaj7': 'VIImaj7',
};

const convertToRoman = (chord: string) => {
    // This is a simplified converter. A real one would need key context.
    return romanNumeralMap[chord] || chord;
}

export default function ChordDisplay({ chords, isLoading, currentSong }: ChordDisplayProps) {
  const [notation, setNotation] = useState('standard');
  
  const parsedChords = chords?.split(/[\s-]+/).filter(c => c);

  const renderChords = () => {
    if (!parsedChords) return null;
    return parsedChords.map((chord, index) => (
      <Card key={index} className="bg-card/80 shadow-md transform hover:scale-105 transition-transform duration-300">
        <CardContent className="p-4 flex flex-col items-center justify-center aspect-square">
          <p className="text-3xl lg:text-4xl font-bold font-headline text-primary">
            {notation === 'roman' ? convertToRoman(chord) : chord}
          </p>
        </CardContent>
      </Card>
    ));
  };

  const renderSkeletons = () => (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[...Array(12)].map((_, i) => (
         <Card key={i} className="bg-card/80 shadow-md">
            <CardContent className="p-4 flex flex-col items-center justify-center aspect-square">
                <Skeleton className="h-10 w-20 bg-muted/50" />
            </CardContent>
        </Card>
      ))}
    </div>
  );
  
  const renderEmptyState = () => (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Music className="w-24 h-24 text-muted-foreground/20 mb-4" />
        <h3 className="text-xl font-headline font-semibold">Ready to Jam?</h3>
        <p className="text-muted-foreground mt-2">Select a song from the music player to see its chords appear here.</p>
      </div>
  )

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-2xl font-headline font-semibold">Chord Progression</h2>
        <div className="flex items-center gap-4">
            <Settings className="w-5 h-5 text-muted-foreground" />
             <RadioGroup defaultValue="standard" value={notation} onValueChange={setNotation} className="flex gap-4">
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="standard" id="r1" />
                    <Label htmlFor="r1">Standard</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="roman" id="r2" />
                    <Label htmlFor="r2">Roman</Label>
                </div>
            </RadioGroup>
        </div>
      </div>
      
      {currentSong && (
        <div className="flex items-center gap-4 mb-6 p-4 rounded-lg bg-primary/10">
            <Image src={currentSong.art} alt={currentSong.name} width={64} height={64} className="rounded-lg shadow-md" data-ai-hint="music album" />
            <div className="overflow-hidden">
                <p className="text-lg font-bold font-headline truncate">{currentSong.name}</p>
                <p className="text-muted-foreground truncate">{currentSong.artist}</p>
            </div>
            {isLoading && <Badge variant="secondary" className="ml-auto animate-pulse bg-accent/80 text-accent-foreground">Syncing...</Badge>}
        </div>
      )}

      <div className="flex-1 overflow-auto pr-2 -mr-2">
        {isLoading ? (
          renderSkeletons()
        ) : chords ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in duration-500">
            {renderChords()}
          </div>
        ) : (
          renderEmptyState()
        )}
      </div>
    </div>
  );
}
