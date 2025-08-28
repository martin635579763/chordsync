
'use client';

import { useState, useRef, FormEvent, useEffect, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { SpotifyIcon } from '@/components/icons';
import { Search, Music, Upload, Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { searchSongs, getInitialSongs } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

type Song = {
  uri: string;
  name: string;
  artist: string;
  art: string;
  previewUrl: string | null;
  isLocal: boolean;
};


interface MusicPlayerProps {
  onSongSelect: (song: Omit<Song, 'previewUrl' | 'isLocal'>) => void;
  isLoading: boolean;
}

export default function MusicPlayer({ onSongSelect, isLoading }: MusicPlayerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingInitial, setIsFetchingInitial] = useState(true);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchInitialSongs = async () => {
      setIsFetchingInitial(true);
      const result = await getInitialSongs();
      if (result.success && result.data) {
        const songsWithLocalFlag = result.data.map(song => ({ ...song, isLocal: false }));
        setSearchResults(songsWithLocalFlag);
      } else {
         toast({
            variant: "destructive",
            title: "Could not load songs",
            description: result.error,
          });
      }
      setIsFetchingInitial(false);
    };
    fetchInitialSongs();
  }, [toast]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && selectedSong?.previewUrl && audio.src !== selectedSong.previewUrl) {
        audio.src = selectedSong.previewUrl;
        audio.play().catch(e => console.error("Error playing audio on select:", e));
    }
  }, [selectedSong]);


  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!searchQuery) {
        return;
    };

    setIsSearching(true);
    const result = await searchSongs(searchQuery);
    setIsSearching(false);

    if (result.success && result.data) {
      if (result.data.length > 0) {
        const songsWithLocalFlag = result.data.map(song => ({ ...song, isLocal: false }))
        setSearchResults(songsWithLocalFlag);
      } else {
        setSearchResults([]);
        toast({ title: 'No results', description: 'No songs found for your search.' });
      }
    } else {
      toast({
        variant: "destructive",
        title: "Search Failed",
        description: result.error || "An unknown error occurred during search.",
      });
    }
  };


  const handleSelect = (song: Song) => {
    onSongSelect({uri: song.uri, name: song.name, artist: song.artist, art: song.art});
    setSelectedSong(song);
    
    if (!song.previewUrl && !song.isLocal) {
        toast({
            variant: "destructive",
            title: "Preview Unavailable",
            description: "A 30-second preview is not available for this song on Spotify.",
        });
    }
  };
  
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      const fileSong: Song = {
        uri: `local:file:${file.name}`,
        name: file.name.replace(/\.[^/.]+$/, ""),
        artist: 'Local File',
        art: 'https://picsum.photos/100/100?random=99',
        previewUrl: fileUrl,
        isLocal: true,
      };
      setSearchResults(prev => [fileSong, ...prev.filter(s => !s.isLocal)]);
      handleSelect(fileSong);
    }
  };
  
  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (selectedSong && !selectedSong.previewUrl) {
      toast({
            variant: "destructive",
            title: "Preview Unavailable",
            description: "A 30-second preview is not available for this song on Spotify.",
        });
      return;
    }

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(e => console.error("Error playing audio on click:", e));
    }
  }

  const renderSongList = () => {
    if (isFetchingInitial || isSearching) {
      return (
          <div className="flex justify-center items-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
      );
    }

    if (searchResults.length === 0) {
      return (
          <div className="text-center py-4 text-muted-foreground">
              <p>No songs to display. Try a search!</p>
          </div>
      );
    }

    return searchResults.map((song) => (
      <button
        key={song.uri}
        onClick={() => handleSelect(song)}
        disabled={isLoading && selectedSong?.uri !== song.uri}
        className={`w-full text-left p-2 rounded-lg flex items-center gap-3 transition-colors ${selectedSong?.uri === song.uri ? 'bg-primary/20' : 'hover:bg-primary/10'}`}
      >
        <div className="relative w-10 h-10 rounded-md overflow-hidden shrink-0">
           <Image src={song.art} alt={song.name} fill className="object-cover" data-ai-hint="music album" />
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="font-semibold truncate">{song.name}</p>
          <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
        </div>
        {song.uri === selectedSong?.uri && isLoading && (
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        )}
      </button>
    ));
  }

  return (
    <div className="flex flex-col h-full">
      <audio ref={audioRef} />
      <h2 className="text-2xl font-headline font-semibold mb-4 text-center lg:text-left">Music Source</h2>
      <div className="flex-1 flex flex-col min-h-0">
        <form onSubmit={handleSearch} className="relative mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for a song or artist..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={isSearching}>
            {isSearching ? <Loader2 className="animate-spin" /> : <Search />}
          </Button>
        </form>

        <ScrollArea className="flex-1 pr-4 -mr-4 mb-4">
          <p className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2"><SpotifyIcon className="w-5 h-5" /> Spotify Library</p>
          <div className="space-y-2">
            {renderSongList()}
          </div>
        </ScrollArea>
        
        <Separator className="my-4" />

        <div>
           <p className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2"><Music className="w-5 h-5" /> Local File</p>
          <Input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".mp3,.wav" />
          <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Upload MP3 File
          </Button>
        </div>
      </div>
      
      <div className="mt-6 border-t pt-4">
        <div className="flex items-center gap-4 mb-2">
            {selectedSong ? (
                <div className="relative w-14 h-14 rounded-lg shadow-md overflow-hidden shrink-0">
                  <Image src={selectedSong.art} alt={selectedSong.name} fill className="object-cover" data-ai-hint="music album" />
                </div>
            ) : (
                <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center shadow-md">
                    <Music className="w-6 h-6 text-muted-foreground"/>
                </div>
            )}
            <div className="flex-1 overflow-hidden">
                <p className="font-bold text-lg truncate font-headline">{selectedSong?.name || 'Nothing Playing'}</p>
                <p className="text-muted-foreground truncate">{selectedSong?.artist || 'Select a song'}</p>
            </div>
        </div>
        <div className="flex justify-center items-center gap-4 mt-4">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Shuffle className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
                <SkipBack className="w-6 h-6" />
            </Button>
            <Button variant="default" size="icon" className="w-14 h-14 rounded-full shadow-lg bg-accent hover:bg-accent/90" onClick={handlePlayPause} disabled={!selectedSong}>
                {isPlaying ? <Pause className="w-8 h-8 text-accent-foreground" /> : <Play className="w-8 h-8 text-accent-foreground" />}
            </Button>
            <Button variant="ghost" size="icon">
                <SkipForward className="w-6 h-6" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Repeat className="w-5 h-5" />
            </Button>
        </div>
      </div>
    </div>
  );

    