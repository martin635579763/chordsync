
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getChords, getInitialSongs, deleteChords, searchSongs as searchSongsAction } from '@/app/actions';
import ChordDisplay from '@/components/chord-display';
import MusicPlayer from '@/components/music-player';
import { Card, CardContent } from '@/components/ui/card';
import { Guitar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { GenerateChordsOutput } from '@/ai/flows/generate-chords';
import SimpleChordsDisplay from '@/components/simple-chords-display';

type Song = {
  uri: string;
  name: string;
  artist: string;
  art: string;
  previewUrl: string | null;
  isGenerated?: boolean;
};

export default function Home() {
  const [chordData, setChordData] = useState<GenerateChordsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSong, setCurrentSong] = useState<{ name: string; artist: string; art: string, uri: string } | null>(null);
  const { toast } = useToast();

  const [initialSongs, setInitialSongs] = useState<Song[]>([]);
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isFetchingInitial, setIsFetchingInitial] = useState(true);
  const [arrangementStyle, setArrangementStyle] = useState('Standard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isShowingSearchResults, setIsShowingSearchResults] = useState(false);

  const fetchSongs = useCallback(async (style: string) => {
    setIsFetchingInitial(true);
    const result = await getInitialSongs(style);
    if (result.success && result.data) {
      setInitialSongs(result.data);
    } else {
      toast({
        variant: 'destructive',
        title: 'Could not load songs',
        description: result.error,
      });
      setInitialSongs([]);
    }
    setIsFetchingInitial(false);
    return result.data || [];
  }, [toast]);
  
  useEffect(() => {
    fetchSongs(arrangementStyle);
    setChordData(null);
    setCurrentSong(null);
  }, [arrangementStyle, fetchSongs]);


  const handleSongSelect = async (song: { uri: string; name:string; artist: string; art: string; }, forceNew: boolean = false) => {
    const isNewSongRequest = !currentSong || song.uri !== currentSong.uri || !chordData || forceNew;
    
    setIsLoading(true);
    if (isNewSongRequest) {
      setChordData(null);
    }
    setCurrentSong({ name: song.name, artist: song.artist, art: song.art, uri: song.uri });
    
    await new Promise(resolve => setTimeout(resolve, 200));

    const result = await getChords({ songUri: song.uri, arrangementStyle }, forceNew);
    setIsLoading(false);

    if (result.success && result.data) {
      setChordData(result.data);
      if (isShowingSearchResults) {
        setSearchResults(prevResults =>
          prevResults.map(s =>
            s.uri === song.uri ? { ...s, isGenerated: true } : s
          )
        );
      }
       if (song.uri.startsWith('spotify:') && (!initialSongs.some(s => s.uri === song.uri) || forceNew)) {
         fetchSongs(arrangementStyle);
      }
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "An unknown error occurred.",
      });
    }
  };
  
  const handleUpdate = (song: Song) => {
    handleSongSelect(song, true);
  };
  
  const handleDelete = async (song: Song, onDeletionComplete: (updatedSongs: Song[]) => void) => {
    const result = await deleteChords(song.uri, arrangementStyle);
    if (result.success) {
      toast({
        title: 'Deleted',
        description: `Removed "${song.name}" from your generated list.`
      });
      const updatedSongs = await fetchSongs(arrangementStyle);
      onDeletionComplete(updatedSongs);
      
      if (currentSong?.uri === song.uri) {
          if (updatedSongs.length > 0) {
            handleSongSelect(updatedSongs[0]);
          } else {
            setChordData(null);
            setCurrentSong(null);
          }
      }
    } else {
       toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "An unknown error occurred.",
      });
    }
  };

  const handleSearch = async (query: string) => {
    const result = await searchSongsAction(query, arrangementStyle);
    
    if (result.success && result.data) {
      if (result.data.length > 0) {
        setSearchResults(result.data);
      } else {
        setSearchResults([]);
        toast({ title: 'No results', description: 'No songs found for your search on Spotify.' });
      }
    } else {
      toast({
        variant: "destructive",
        title: "Search Failed",
        description: result.error || "An unknown error occurred during search.",
      });
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-background p-4 sm:p-6 md:p-8">
      <header className="w-full max-w-7xl mb-8 flex items-center justify-center sm:justify-start">
        <h1 className="text-4xl md:text-5xl font-logo font-bold text-primary flex items-center gap-3">
          <Guitar className="h-10 w-10" />
          耗子歌手的吉他屋
        </h1>
      </header>
      <div className="w-full max-w-7xl grid grid-cols-1 xl:grid-cols-3 gap-8 flex-1">
        <Card className="shadow-lg bg-card/50 xl:col-span-1">
          <CardContent className="p-4 md:p-6 h-full">
            <MusicPlayer
              onSongSelect={handleSongSelect}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onSearch={handleSearch}
              isLoading={isLoading}
              initialSongs={initialSongs}
              searchResults={searchResults}
              isFetchingInitial={isFetchingInitial}
              arrangementStyle={arrangementStyle}
              setArrangementStyle={setArrangementStyle}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              isShowingSearchResults={isShowingSearchResults}
              setIsShowingSearchResults={setIsShowingSearchResults}
            />
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:col-span-2 gap-8">
          <Card className="shadow-lg bg-card/50 lg:col-span-2">
            <CardContent className="p-4 md:p-6 h-full">
              <ChordDisplay 
                chordData={chordData} 
                isLoading={isLoading} 
                currentSong={currentSong} 
              />
            </CardContent>
          </Card>
          <Card className="shadow-lg bg-card/50 lg:col-span-1">
            <CardContent className="p-4 md:p-6 h-full">
              <SimpleChordsDisplay
                chordData={chordData}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </div>
      </div>
       <footer className="mt-8 text-center text-muted-foreground text-sm">
        <p>Built for dual-screen, works on your desktop. Powered by AI.</p>
      </footer>
    </main>
  );
}

    