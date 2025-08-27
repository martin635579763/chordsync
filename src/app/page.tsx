'use client';

import { useState } from 'react';
import { getChords } from '@/app/actions';
import ChordDisplay from '@/components/chord-display';
import MusicPlayer from '@/components/music-player';
import { Card, CardContent } from '@/components/ui/card';
import { Guitar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [chords, setChords] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSong, setCurrentSong] = useState<{ name: string; artist: string; art: string } | null>(null);
  const { toast } = useToast();

  const handleSongSelect = async (song: { uri: string; name:string; artist: string; art: string; }) => {
    setIsLoading(true);
    setChords(null);
    setCurrentSong({ name: song.name, artist: song.artist, art: song.art });
    
    // Simulate API delay for a better UX feel
    await new Promise(resolve => setTimeout(resolve, 1500));

    const result = await getChords({ songUri: song.uri });

    if (result.success && result.data) {
      setChords(result.data.chordProgression);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "An unknown error occurred.",
      });
      setCurrentSong(null);
    }
    setIsLoading(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-background p-4 sm:p-6 md:p-8">
      <header className="w-full max-w-7xl mb-8 flex items-center justify-center sm:justify-start">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary flex items-center gap-3">
          <Guitar className="h-10 w-10" />
          ChordSync
        </h1>
      </header>
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
        <Card className="shadow-lg bg-card/50">
          <CardContent className="p-4 md:p-6 h-full">
            <MusicPlayer onSongSelect={handleSongSelect} isLoading={isLoading} />
          </CardContent>
        </Card>
        <Card className="shadow-lg bg-card/50">
          <CardContent className="p-4 md:p-6 h-full">
            <ChordDisplay 
              chords={chords} 
              isLoading={isLoading} 
              currentSong={currentSong} 
            />
          </CardContent>
        </Card>
      </div>
       <footer className="mt-8 text-center text-muted-foreground text-sm">
        <p>Built for dual-screen, works on your desktop. Powered by AI.</p>
      </footer>
    </main>
  );
}
