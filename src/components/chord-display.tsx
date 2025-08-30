
'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Music, PlayCircle, PauseCircle, Loader2 } from 'lucide-react';
import type { GenerateChordsOutput } from '@/app/types';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

interface ChordDisplayProps {
  chordData: GenerateChordsOutput | null;
  isLoading: boolean;
  currentSong: { name: string; artist: string; art: string, uri: string } | null;
}

export default function ChordDisplay({ chordData, isLoading, currentSong }: ChordDisplayProps) {
  
  const renderLyricsAndChords = () => {
    if (!chordData?.lines) return null;
    
    // When lyrics are present
    if (chordData.lines.some(line => line.lyrics)) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                {chordData.lines.map((line, lineIndex) => (
                    <div key={lineIndex} className="flex flex-col gap-1">
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                           {line.measures.map((measure, measureIndex) => (
                                <span key={measureIndex} className="text-primary font-bold font-code text-sm min-h-[1em]">{measure.chords || ' '}</span>
                            ))}
                        </div>
                        <p className="text-foreground text-lg">{line.lyrics || ' '}</p>
                    </div>
                ))}
            </div>
        )
    }

    // When no lyrics, display chords in a grid
    const allMeasures = chordData.lines.flatMap(line => line.measures);
    return (
        <div className="grid grid-cols-4 gap-4 animate-in fade-in duration-500">
            {allMeasures.map((measure, index) => (
                <div key={index} className="flex items-center justify-center p-2 rounded-md bg-muted/30">
                    <span className="text-primary font-bold font-code text-lg">{measure.chords || ' '}</span>
                </div>
            ))}
        </div>
    )
  }

  const renderSkeletons = () => (
    <div className="space-y-6">
       {[...Array(8)].map((_, i) => (
         <div key={i} className="space-y-2">
            <div className="grid grid-cols-4 gap-4">
                <Skeleton className="h-5 w-1/4 bg-muted/50" />
                <Skeleton className="h-5 w-1/4 bg-muted/50" />
            </div>
            <Skeleton className="h-6 w-full bg-muted/50 mt-2" />
        </div>
      ))}
    </div>
  );
  
  const renderEmptyState = () => (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Music className="w-24 h-24 text-muted-foreground/20 mb-4" />
        <h3 className="text-xl font-headline font-semibold">Ready to Jam?</h3>
        <p className="text-muted-foreground mt-2">Select a song to see its chords.</p>
      </div>
  )

  return (
    <div className="flex flex-col h-full">
      {currentSong && (
        <div className="flex items-center gap-4 mb-6 p-4 rounded-lg bg-primary/10">
            <div className="relative w-16 h-16 rounded-lg shadow-md overflow-hidden shrink-0">
              <Image src={currentSong.art} alt={currentSong.name} fill sizes="64px" className="object-cover" data-ai-hint="music album" />
            </div>
            <div className="overflow-hidden">
                <p className="text-lg font-bold font-headline truncate">{currentSong.name}</p>
                <p className="text-muted-foreground truncate">{currentSong.artist}</p>
            </div>
            {isLoading && <Badge variant="secondary" className="ml-auto animate-pulse bg-accent/80 text-accent-foreground">Syncing...</Badge>}
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-headline font-semibold">Chord Progression</h2>
      </div>
      
      <div className="flex-1 overflow-auto pr-2 -mr-2">
        {isLoading ? (
          renderSkeletons()
        ) : chordData ? (
          renderLyricsAndChords()
        ) : (
          renderEmptyState()
        )}
      </div>
    </div>
  );
}
