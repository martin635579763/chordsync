'use client';

import { useState, useMemo, ChangeEvent, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { SpotifyIcon } from '@/components/icons';
import { Search, Music, Upload, Play, Pause, SkipBack, SkipForward, Repeat, Shuffle } from 'lucide-react';
import Image from 'next/image';

const mockSongs = [
  { uri: 'spotify:track:jaychou1', name: '晴天', artist: '周杰伦', art: 'https://picsum.photos/100/100?random=1' },
  { uri: 'spotify:track:jaychou2', name: '七里香', artist: '周杰伦', art: 'https://picsum.photos/100/100?random=2' },
  { uri: 'spotify:track:jaychou3', name: '稻香', artist: '周杰伦', art: 'https://picsum.photos/100/100?random=3' },
  { uri: 'spotify:track:jaychou4', name: '告白气球', artist: '周杰伦', art: 'https://picsum.photos/100/100?random=4' },
  { uri: 'spotify:track:mayday1', name: '突然好想你', artist: '五月天', art: 'https://picsum.photos/100/100?random=5' },
  { uri: 'spotify:track:mayday2', name: '倔强', artist: '五月天', art: 'https://picsum.photos/100/100?random=6' },
  { uri: 'spotify:track:jjlin1', name: '可惜没如果', artist: '林俊杰', art: 'https://picsum.photos/100/100?random=7' },
];

type Song = typeof mockSongs[0];

interface MusicPlayerProps {
  onSongSelect: (song: Song) => void;
  isLoading: boolean;
}

export default function MusicPlayer({ onSongSelect, isLoading }: MusicPlayerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredSongs = useMemo(() => {
    return mockSongs.filter(
      (song) =>
        song.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleSelect = (song: Song) => {
    setSelectedSong(song);
    onSongSelect(song);
    setIsPlaying(true);
  };
  
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileSong = {
        uri: `local:file:${file.name}`,
        name: file.name.replace(/\.[^/.]+$/, ""),
        artist: 'Local File',
        art: 'https://picsum.photos/100/100?random=99',
      };
      handleSelect(fileSong);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-headline font-semibold mb-4 text-center lg:text-left">Music Source</h2>
      <div className="flex-1 flex flex-col min-h-0">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search for a song or artist..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <ScrollArea className="flex-1 pr-4 -mr-4 mb-4">
          <p className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2"><SpotifyIcon className="w-5 h-5" /> Spotify Library</p>
          <div className="space-y-2">
            {filteredSongs.map((song) => (
              <button
                key={song.uri}
                onClick={() => handleSelect(song)}
                disabled={isLoading && selectedSong?.uri !== song.uri}
                className={`w-full text-left p-2 rounded-lg flex items-center gap-3 transition-colors ${selectedSong?.uri === song.uri ? 'bg-primary/20' : 'hover:bg-primary/10'}`}
              >
                <Image src={song.art} alt={song.name} width={40} height={40} className="rounded-md" data-ai-hint="music album" />
                <div className="flex-1 overflow-hidden">
                  <p className="font-semibold truncate">{song.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                </div>
              </button>
            ))}
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
                <Image src={selectedSong.art} alt={selectedSong.name} width={56} height={56} className="rounded-lg shadow-md" data-ai-hint="music album" />
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
            <Button variant="default" size="icon" className="w-14 h-14 rounded-full shadow-lg bg-accent hover:bg-accent/90" onClick={() => setIsPlaying(!isPlaying)}>
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
