
'use client';

import { useState, useRef, FormEvent, useEffect, ChangeEvent, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { SpotifyIcon } from '@/components/icons';
import { Search, Music, Upload, Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Loader2, Wand2, RefreshCw, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { searchSongs } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

type Song = {
  uri: string;
  name: string;
  artist: string;
  art: string;
  previewUrl: string | null;
  isGenerated?: boolean;
};

interface MusicPlayerProps {
  onSongSelect: (song: Omit<Song, 'previewUrl'>, arrangementStyle: string, lyrics?: string, forceNew?: boolean) => void;
  onUpdate: (song: Song, arrangementStyle: string) => void;
  onDelete: (song: Song, arrangementStyle: string) => void;
  isLoading: boolean;
  initialSongs: Song[];
  searchResults: Song[];
  setSearchResults: (songs: Song[]) => void;
  isFetchingInitial: boolean;
  fetchInitialSongs: (style: string) => Promise<Song[]>;
}

export default function MusicPlayer({ 
  onSongSelect, 
  onUpdate,
  onDelete,
  isLoading, 
  initialSongs,
  searchResults,
  setSearchResults,
  isFetchingInitial,
  fetchInitialSongs
}: MusicPlayerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSongForPreview, setSelectedSongForPreview] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [arrangementStyle, setArrangementStyle] = useState('Standard');
  const [uploadedLyrics, setUploadedLyrics] = useState<string | undefined>();
  const lyricsFileRef = useRef<HTMLInputElement>(null);
  const audioFileRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();
  const isStyleChange = useRef(false);
  
  const handleSelect = useCallback((songs: Song[]) => {
      if (isStyleChange.current && songs.length > 0) {
        handleDoubleClick(songs[0]);
        isStyleChange.current = false;
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleArrangementChange = (style: string) => {
    setArrangementStyle(style);
    fetchInitialSongs(style).then(handleSelect);
    isStyleChange.current = true;
  };
  
  useEffect(() => {
    fetchInitialSongs(arrangementStyle);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


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
    if (audio && selectedSongForPreview?.previewUrl && audio.src !== selectedSongForPreview.previewUrl) {
        audio.src = selectedSongForPreview.previewUrl;
        audio.play().catch(e => console.error("Error playing audio on select:", e));
    }
  }, [selectedSongForPreview]);

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!searchQuery) {
        setSearchResults(initialSongs);
        return;
    };

    setIsSearching(true);
    const result = await searchSongs(searchQuery, arrangementStyle);
    setIsSearching(false);

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

  const handleSearchInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query === '') {
        setSearchResults(initialSongs);
    } else {
        const filtered = initialSongs.filter(song => 
            song.name.toLowerCase().includes(query.toLowerCase()) || 
            song.artist.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(filtered);
    }
  }


  const handleSingleClick = (song: Song) => {
    setSelectedSongForPreview(song);

    if (song.previewUrl) {
      if (audioRef.current) {
        if (audioRef.current.src === song.previewUrl && isPlaying) {
          audioRef.current.pause();
        } else {
          audioRef.current.src = song.previewUrl;
          audioRef.current.play().catch(e => console.error("Error playing audio on select:", e));
        }
      }
    } else if (song.uri.startsWith('spotify:')) {
        toast({
            variant: "destructive",
            title: "Preview Unavailable",
            description: "A 30-second preview is not available for this song on Spotify.",
        });
    }
  };
  
  const handleDoubleClick = (song: Song) => {
    if (isLoading) return;
    if (lyricsFileRef.current) lyricsFileRef.current.value = "";
    setUploadedLyrics(undefined);
    
    onSongSelect({uri: song.uri, name: song.name, artist: song.artist, art: song.art}, arrangementStyle, uploadedLyrics);
    setSelectedSongForPreview(song);
  };
  
  const handleUpdateButtonClick = (e: React.MouseEvent, song: Song) => {
    e.stopPropagation(); // Prevent single/double click on the row
    onUpdate(song, arrangementStyle);
  };
  
  const handleDeleteButtonClick = (e: React.MouseEvent, song: Song) => {
    e.stopPropagation();
    onDelete(song, arrangementStyle);
  };

  const handleAudioFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      const fileSong: Song = {
        uri: `local:file:${file.name}`,
        name: file.name.replace(/\.[^/.]+$/, ""),
        artist: 'Local File',
        art: 'https://picsum.photos/100/100?random=99',
        previewUrl: fileUrl,
      };
      setSearchResults([fileSong, ...searchResults.filter(s => !s.uri.startsWith('local:'))]);
      handleDoubleClick(fileSong);
    }
  };

  const handleLyricsFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const songForLyrics = selectedSongForPreview;

    if (file && songForLyrics) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setUploadedLyrics(text);
        onSongSelect({ uri: songForLyrics.uri, name: songForLyrics.name, artist: songForLyrics.artist, art: songForLyrics.art }, arrangementStyle, text);
        toast({ title: 'Lyrics uploaded', description: 'Generating chords for the uploaded lyrics.'})
      };
      reader.readAsText(file);
    } else if (!songForLyrics) {
        toast({ variant: 'destructive', title: 'No song selected', description: 'Please select a song before uploading lyrics.'});
    }
  };
  
  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !selectedSongForPreview) return;
    
    if (!selectedSongForPreview.previewUrl && selectedSongForPreview.uri.startsWith('spotify:')) {
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

    if (searchResults.length === 0 && searchQuery !== '') {
      return (
          <div className="text-center py-4 text-muted-foreground">
              <p>No songs found for "{searchQuery}".</p>
              <p>Click search to look on Spotify.</p>
          </div>
      );
    }
    
    if (searchResults.length === 0) {
      return (
          <div className="text-center py-4 text-muted-foreground">
              <p>No generated songs for this style. Try a search!</p>
          </div>
      );
    }

    return searchResults.map((song) => (
      <div
        key={song.uri}
        role="button"
        tabIndex={0}
        onClick={() => handleSingleClick(song)}
        onDoubleClick={() => handleDoubleClick(song)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleDoubleClick(song); }}
        className={`w-full text-left p-2 rounded-lg flex items-center gap-3 transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${selectedSongForPreview?.uri === song.uri ? 'bg-primary/20' : 'hover:bg-primary/10'}`}
      >
        <div className="relative w-10 h-10 rounded-md overflow-hidden shrink-0">
           <Image src={song.art} alt={song.name} fill sizes="40px" className="object-cover" data-ai-hint="music album" />
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="font-semibold truncate">{song.name}</p>
          <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
        </div>
        
        <div className="flex items-center gap-1 ml-auto">
            {searchQuery && song.isGenerated && <Badge variant="secondary">Generated</Badge>}
            {song.isGenerated && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={(e) => handleUpdateButtonClick(e, song)} disabled={isLoading}>
                        <RefreshCw className={`w-4 h-4 ${isLoading && selectedSongForPreview?.uri === song.uri ? 'animate-spin' : ''}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Regenerate Chords</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
            )}
            {!searchQuery && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/80 hover:text-destructive" onClick={(e) => handleDeleteButtonClick(e, song)} disabled={isLoading}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete Arrangement</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
        </div>
        
        {isLoading && selectedSongForPreview?.uri === song.uri && !song.isGenerated && (
          <Loader2 className="w-5 h-5 animate-spin text-primary ml-auto" />
        )}
      </div>
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
              placeholder="Filter local list or search Spotify..."
              className="pl-10"
              value={searchQuery}
              onChange={handleSearchInputChange}
              disabled={isLoading}
            />
          </div>
          <Button type="submit" disabled={isSearching || isLoading}>
            {isSearching ? <Loader2 className="animate-spin" /> : <SpotifyIcon className="w-5 h-5" />}
          </Button>
        </form>

        <div className="mb-4 space-y-2">
          <Label htmlFor="arrangement-style" className="flex items-center gap-2 text-muted-foreground"><Wand2 className="w-4 h-4 text-accent"/> Arrangement Style</Label>
          <Select value={arrangementStyle} onValueChange={handleArrangementChange} disabled={isLoading}>
            <SelectTrigger id="arrangement-style" className="w-full">
              <SelectValue placeholder="Select arrangement style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Standard">Standard</SelectItem>
              <SelectItem value="Pop Arrangement">Pop Arrangement</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="flex-1 pr-4 -mr-4 mb-4">
          <p className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2"><Music className="w-5 h-5" /> {searchQuery ? 'Search Results' : 'Generated Library'}</p>
          <div className="space-y-2">
            {renderSongList()}
          </div>
        </ScrollArea>
        
        <Separator className="my-4" />

        <div>
           <p className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2"><Music className="w-5 h-5" /> Local Files</p>
           <div className="grid grid-cols-2 gap-2">
                <Input type="file" ref={audioFileRef} onChange={handleAudioFileChange} className="hidden" accept=".mp3,.wav" />
                <Button variant="outline" className="w-full" onClick={() => audioFileRef.current?.click()} disabled={isLoading}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload MP3
                </Button>
                <Input type="file" ref={lyricsFileRef} onChange={handleLyricsFileChange} className="hidden" accept=".txt" />
                <Button variant="outline" className="w-full" onClick={() => lyricsFileRef.current?.click()} disabled={!selectedSongForPreview || isLoading}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Lyrics (.txt)
                </Button>
           </div>
        </div>
      </div>
      
      <div className="mt-6 border-t pt-4">
        <div className="flex items-center gap-4 mb-2">
            {selectedSongForPreview ? (
                <div className="relative w-14 h-14 rounded-lg shadow-md overflow-hidden shrink-0">
                  <Image src={selectedSongForPreview.art} alt={selectedSongForPreview.name} fill sizes="56px" className="object-cover" data-ai-hint="music album" />
                </div>
            ) : (
                <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center shadow-md">
                    <Music className="w-6 h-6 text-muted-foreground"/>
                </div>
            )}
            <div className="flex-1 overflow-hidden">
                <p className="font-bold text-lg truncate font-headline">{selectedSongForPreview?.name || 'Nothing Playing'}</p>
                <p className="text-muted-foreground truncate">{selectedSongForPreview?.artist || 'Select a song'}</p>
            </div>
        </div>
        <div className="flex justify-center items-center gap-4 mt-4">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Shuffle className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
                <SkipBack className="w-6 h-6" />
            </Button>
            <Button variant="default" size="icon" className="w-14 h-14 rounded-full shadow-lg bg-accent hover:bg-accent/90" onClick={handlePlayPause} disabled={!selectedSongForPreview}>
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
}
