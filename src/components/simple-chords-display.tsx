
'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Guitar } from 'lucide-react';
import type { GenerateChordsOutput } from '@/ai/flows/generate-chords';
import FretboardDiagram from '@/components/fretboard-diagram';


interface SimpleChordsDisplayProps {
  chordData: GenerateChordsOutput | null;
  isLoading: boolean;
}

export default function SimpleChordsDisplay({ chordData, isLoading }: SimpleChordsDisplayProps) {

  const renderSimpleChords = () => {
    if (!chordData?.uniqueChords) return null;
    
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-4 animate-in fade-in duration-500">
            {chordData.uniqueChords.map((chord, index) => (
                <div key={`${chord}-${index}`} className="flex flex-col items-center gap-2">
                    <p className="text-xl font-bold font-headline text-primary">{chord}</p>
                    <FretboardDiagram chord={chord} />
                </div>
            ))}
        </div>
    );
  };

  const renderSkeletons = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-4">
       {[...Array(6)].map((_, i) => (
         <div key={i} className="flex flex-col items-center gap-2">
            <Skeleton className="h-7 w-12 bg-muted/50" />
            <Skeleton className="w-[100px] h-[120px] bg-muted/50 rounded-md" />
        </div>
      ))}
    </div>
  );
  
  const renderEmptyState = () => (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Guitar className="w-24 h-24 text-muted-foreground/20 mb-4" />
        <h3 className="text-lg font-headline font-semibold">Chord Cheatsheet</h3>
        <p className="text-muted-foreground text-sm mt-2">All chords for the selected song will appear here.</p>
      </div>
  )

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-headline font-semibold mb-4">Chord Cheatsheet</h2>
      <div className="flex-1 overflow-auto pr-2 -mr-2">
        {isLoading ? (
          renderSkeletons()
        ) : chordData ? (
          renderSimpleChords()
        ) : (
          renderEmptyState()
        )}
      </div>
    </div>
  );
}
