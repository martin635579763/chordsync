
'use client';

import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Guitar, Wand2, Loader2 } from 'lucide-react';
import type { GenerateChordsOutput } from '@/ai/flows/generate-chords';
import FretboardDiagram from '@/components/fretboard-diagram';
import { getAccompanimentText, type GenerateAccompanimentTextOutput } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from './ui/badge';


interface SimpleChordsDisplayProps {
  chordData: GenerateChordsOutput | null;
  isLoading: boolean;
  currentSong: { name: string; artist: string; } | null;
  arrangementStyle: string;
}

export default function SimpleChordsDisplay({ chordData, isLoading, currentSong, arrangementStyle }: SimpleChordsDisplayProps) {
  const [suggestion, setSuggestion] = useState<GenerateAccompanimentTextOutput | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const { toast } = useToast();

  const handleGetSuggestion = async () => {
    if (!chordData || !currentSong) return;
    
    setIsSuggesting(true);
    setSuggestion(null);

    const result = await getAccompanimentText({
        songName: currentSong.name,
        artistName: currentSong.artist,
        chords: chordData,
        arrangementStyle: arrangementStyle,
    });
    
    setIsSuggesting(false);

    if (result.success && result.data) {
        setSuggestion(result.data);
    } else {
        toast({
            variant: "destructive",
            title: "Suggestion Failed",
            description: result.error || "Could not generate playing suggestions."
        })
    }
  }

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

  const renderSuggestion = () => {
    if (isSuggesting) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-6 w-1/3 mt-2" />
                <Skeleton className="h-10 w-full" />
            </div>
        )
    }

    if (!suggestion) return null;

    return (
      <Card className="bg-transparent border-0 shadow-none animate-in fade-in duration-500">
        <CardContent className="p-0 space-y-4">
            <div>
                <h4 className="font-semibold text-primary mb-1">Playing Style</h4>
                <p className="text-sm text-muted-foreground">{suggestion.playingStyleSuggestion}</p>
            </div>
             <div>
                <h4 className="font-semibold text-primary mb-1">Strumming Pattern</h4>
                <Badge variant="secondary" className="font-mono text-base">{suggestion.strummingPattern}</Badge>
            </div>
            {suggestion.advancedTechniques && (
                 <div>
                    <h4 className="font-semibold text-primary mb-1">Advanced Techniques</h4>
                    <p className="text-sm text-muted-foreground">{suggestion.advancedTechniques}</p>
                </div>
            )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-headline font-semibold mb-4">Chord Cheatsheet</h2>
      <div className="flex-1 overflow-auto pr-2 -mr-2">
        {isLoading ? (
          renderSkeletons()
        ) : chordData ? (
          <>
            <div className="mb-6">
                <Button onClick={handleGetSuggestion} disabled={isSuggesting || isLoading} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                    {isSuggesting ? <Loader2 className="animate-spin" /> : <Wand2 />}
                    Get Playing Suggestions
                </Button>
            </div>

            {suggestion || isSuggesting ? renderSuggestion() : renderSimpleChords()}

          </>
        ) : (
          renderEmptyState()
        )}
      </div>
    </div>
  );
}
