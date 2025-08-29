'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Music } from 'lucide-react';
import type { GenerateChordsOutput } from '@/ai/flows/generate-chords';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import FretboardDiagram from '@/components/fretboard-diagram';


interface ChordDisplayProps {
  chordData: GenerateChordsOutput | null;
  isLoading: boolean;
  currentSong: { name: string; artist: string; art: string } | null;
}

export default function ChordDisplay({ chordData, isLoading, currentSong }: ChordDisplayProps) {
  
  const renderSimpleChords = () => {
    if (!chordData?.uniqueChords) return null;
    
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in duration-500">
            {chordData.uniqueChords.map((chord, index) => (
                <div key={`${chord}-${index}`} className="flex flex-col items-center gap-2">
                    <p className="text-xl font-bold font-headline text-primary">{chord}</p>
                    <FretboardDiagram chord={chord} />
                </div>
            ))}
        </div>
    );
  };
  
  const renderLyricsAndChords = () => {
    if (!chordData?.lines) return null;
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {chordData.lines.map((line, lineIndex) => (
                <div key={lineIndex} className="grid grid-cols-4 gap-x-4 gap-y-1">
                    {line.measures.map((measure, measureIndex) => (
                        <div key={measureIndex} className="flex flex-col">
                            <span className="text-primary font-bold font-code text-sm">{measure.chords || ' '}</span>
                            <span className="text-muted-foreground font-code text-xs mt-1">{measure.strummingPattern || ' '}</span>
                        </div>
                    ))}
                    <p className="col-span-4 text-foreground text-lg mt-1">{line.lyrics || ' '}</p>
                </div>
            ))}
        </div>
    )
  }

  const renderSkeletons = () => (
    <div className="space-y-6">
       {[...Array(4)].map((_, i) => (
         <div key={i} className="space-y-2">
            <div className="grid grid-cols-4 gap-4">
                <Skeleton className="h-5 w-1/2 bg-muted/50" />
                <Skeleton className="h-5 w-1/2 bg-muted/50" />
                <Skeleton className="h-5 w-1/2 bg-muted/50" />
                <Skeleton className="h-5 w-1/2 bg-muted/50" />
            </div>
            <Skeleton className="h-6 w-full bg-muted/50" />
        </div>
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
      </div>
      
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

      <div className="flex-1 overflow-auto pr-2 -mr-2">
        {isLoading ? (
          renderSkeletons()
        ) : chordData ? (
          <Tabs defaultValue="lyrics" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="lyrics">Lyrics & Chords</TabsTrigger>
              <TabsTrigger value="chords">Simple Chords</TabsTrigger>
            </TabsList>
            <TabsContent value="lyrics" className="mt-4">
              {renderLyricsAndChords()}
            </TabsContent>
            <TabsContent value="chords" className="mt-4">
               {renderSimpleChords()}
            </TabsContent>
          </Tabs>
        ) : (
          renderEmptyState()
        )}
      </div>
    </div>
  );
}
