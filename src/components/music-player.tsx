
'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SpotifyIcon } from '@/components/icons';
import { Search, Music, Loader2, Wand2, Trash2, ArrowLeft, RefreshCw } from 'lucide-react';
import Image from 'next/image';
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
  onSongSelect: (song: Omit<Song, 'previewUrl' | 'isGenerated'>, forceNew?: boolean) => void;
  onUpdate: (song: Song) => void;
  onDelete: (song: Song) => void;
  onSearch: (query: string) => void;
  isLoading: boolean;
  initialSongs: Song[];
  searchResults: Song[];
  isFetchingInitial: boolean;
  arrangementStyle: string;
  setArrangementStyle: (style: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isShowingSearchResults: boolean;
  setIsShowingSearchResults: (isShowing: boolean) => void;
  isAdmin: boolean;
}

export default function MusicPlayer({ 
  onSongSelect, 
  onUpdate,
  onDelete,
  onSearch,
  isLoading, 
  initialSongs,
  searchResults,
  isFetchingInitial,
  arrangementStyle,
  setArrangementStyle,
  searchQuery,
  setSearchQuery,
  isShowingSearchResults,
  setIsShowingSearchResults,
  isAdmin,
}: MusicPlayerProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSongUri, setSelectedSongUri] = useState<string | null>(null);

  const handleSearchSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!searchQuery) return;
    setIsSearching(true);
    await onSearch(searchQuery);
    setIsShowingSearchResults(true);
    setIsSearching(false);
  };

  const handleSearchInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }

  const handleBackToLibrary = () => {
    setIsShowingSearchResults(false);
    setSearchQuery('');
  };
  
  const handleRowClick = (song: Song) => {
    if (isLoading) return;
    setSelectedSongUri(song.uri);
    onSongSelect({uri: song.uri, name: song.name, artist: song.artist, art: song.art});
  };
  
  const handleUpdateButtonClick = (e: React.MouseEvent, song: Song) => {
    e.stopPropagation(); // Prevent click on the row
    onUpdate(song);
  };
  
  const handleDeleteButtonClick = (e: React.MouseEvent, song: Song) => {
    e.stopPropagation();
    onDelete(song);
  };

  const renderSongList = () => {
    const songList = isShowingSearchResults ? searchResults : initialSongs;

    if (isFetchingInitial && !isShowingSearchResults) {
      return (
          <div className="flex justify-center items-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
      );
    }

    if (songList.length === 0 && isShowingSearchResults) {
      return (
          <div className="text-center py-4 text-muted-foreground">
              <p>Search for songs on Spotify.</p>
          </div>
      );
    }
    
    if (songList.length === 0 && !isShowingSearchResults) {
      return (
          <div className="text-center py-4 text-muted-foreground">
              <p>No generated songs for this style. Try a search!</p>
          </div>
      );
    }

    return songList.map((song) => (
      <div
        key={song.uri}
        role="button"
        tabIndex={0}
        onClick={() => handleRowClick(song)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleRowClick(song); }}
        className={`w-full text-left p-2 rounded-lg flex items-center gap-3 transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${selectedSongUri === song.uri ? 'bg-primary/20' : 'hover:bg-primary/10'}`}
      >
        <div className="relative w-10 h-10 rounded-md overflow-hidden shrink-0">
           <Image src={song.art} alt={song.name} fill sizes="40px" className="object-cover" data-ai-hint="music album" />
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="font-semibold truncate">{song.name}</p>
          <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
        </div>
        
        {isAdmin && song.isGenerated && (
          <div className="flex items-center gap-1 ml-auto">
              <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleUpdateButtonClick(e, song)} disabled={isLoading}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Force Regenerate</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
          </div>
        )}
        
        {isLoading && selectedSongUri === song.uri && !song.isGenerated && (
          <Loader2 className="w-5 h-5 animate-spin text-primary ml-auto" />
        )}
      </div>
    ));
  }

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-headline font-semibold mb-4 text-center lg:text-left">Music Source</h2>
      <div className="flex-1 flex flex-col min-h-0">
        <form onSubmit={handleSearchSubmit} className="relative mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search Spotify..."
              className="pl-10"
              value={searchQuery}
              onChange={handleSearchInputChange}
              disabled={isLoading}
            />
          </div>
          <Button type="submit" disabled={isSearching || isLoading || !searchQuery}>
            {isSearching ? <Loader2 className="animate-spin" /> : <SpotifyIcon className="w-5 h-5" />}
          </Button>
        </form>

        <div className="mb-4 space-y-2">
          <Label htmlFor="arrangement-style" className="flex items-center gap-2 text-muted-foreground"><Wand2 className="w-4 h-4 text-accent"/> Arrangement Style</Label>
          <Select value={arrangementStyle} onValueChange={setArrangementStyle} disabled={isLoading}>
            <SelectTrigger id="arrangement-style" className="w-full">
              <SelectValue placeholder="Select arrangement style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Standard">Standard</SelectItem>
              <SelectItem value="Pop Arrangement">Pop Arrangement</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="flex-1">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Music className="w-5 h-5" /> 
              {isShowingSearchResults ? 'Search Results' : 'Generated Library'}
            </p>
            {isShowingSearchResults && (
              <Button variant="ghost" size="sm" onClick={handleBackToLibrary} className="text-sm">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {renderSongList()}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
