
'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Music, PlayCircle, PauseCircle, Loader2, Youtube } from 'lucide-react';
import type { GenerateChordsOutput } from '@/app/types';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { getYouTubeVideoId } from '@/app/actions';
import YouTube from 'react-youtube';

interface ChordDisplayProps {
  chordData: GenerateChordsOutput | null;
  isLoading: boolean;
  currentSong: { name: string; artist: string; art: string, uri: string } | null;
}

export default function ChordDisplay({ chordData, isLoading, currentSong }: ChordDisplayProps) {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isFetchingVideo, setIsFetchingVideo] = useState(false);
  const [activeLine, setActiveLine] = useState(-1);
  const [player, setPlayer] = useState<any>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (currentSong && !isLoading) {
      const fetchVideo = async () => {
        setIsFetchingVideo(true);
        setVideoId(null);
        setActiveLine(-1);
        const result = await getYouTubeVideoId(currentSong.name, currentSong.artist);
        if (result.success && result.videoId) {
          setVideoId(result.videoId);
        } else {
          toast({
            variant: 'destructive',
            title: 'Video Not Found',
            description: result.error,
          });
        }
        setIsFetchingVideo(false);
      };
      fetchVideo();
    } else {
        setVideoId(null);
        setActiveLine(-1);
    }
  }, [currentSong, isLoading, toast]);

  useEffect(() => {
    if (!player || !chordData?.lines) return;

    const interval = setInterval(async () => {
      const currentTime = await player.getCurrentTime();
      if (!chordData?.lines) return;
      
      const currentLineIndex = chordData.lines.findIndex((line, index) => {
        const nextLine = chordData.lines[index + 1];
        return currentTime >= line.startTime && (!nextLine || currentTime < nextLine.startTime);
      });

      if (currentLineIndex !== -1 && currentLineIndex !== activeLine) {
        setActiveLine(currentLineIndex);
      }
    }, 500);

    return () => clearInterval(interval);

  }, [player, chordData, activeLine]);

   useEffect(() => {
    if (activeLine >= 0 && lineRefs.current[activeLine] && scrollContainerRef.current) {
      lineRefs.current[activeLine]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLine]);


  const renderLyricsAndChords = () => {
    if (!chordData?.lines) return null;
    
    // Always render lyrics and chords if available, even if lyrics are empty strings
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {chordData.lines.map((line, lineIndex) => (
          <div 
            key={lineIndex} 
            ref={el => lineRefs.current[lineIndex] = el}
            className={`transition-all duration-300 p-2 rounded-lg ${activeLine === lineIndex ? 'bg-primary/20 scale-105' : ''}`}
          >
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-primary font-bold font-code text-sm min-h-[1em]">
              {line.measures.map((measure, measureIndex) => (
                <span key={measureIndex} className="pr-4 border-r-2 last:border-r-0 border-primary/20">
                  {measure.chords || ' '}
                </span>
              ))}
            </div>
            <p className="text-foreground text-lg">{line.lyrics || ' '}</p>
          </div>
        ))}
      </div>
    );
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
  
  const renderVideoPlayer = () => {
    if (!currentSong) return null;

    if (isFetchingVideo) {
      return (
        <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p>Finding video on YouTube...</p>
        </div>
      )
    }

    if (videoId) {
       const opts = {
          height: '100%',
          width: '100%',
          playerVars: {
            autoplay: 1,
            controls: 1,
          },
        };
      return (
          <div className="aspect-video rounded-lg overflow-hidden shadow-lg bg-black">
            <YouTube 
              videoId={videoId} 
              opts={opts} 
              className="w-full h-full"
              onReady={(event) => setPlayer(event.target)}
              onPlay={() => {
                if (activeLine === -1) setActiveLine(0);
              }}
            />
          </div>
      );
    }
    
    // Fallback when no video is found or being fetched
     return (
        <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Youtube className="w-12 h-12" />
          <p>Select a song to load the video</p>
        </div>
      )
  }


  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        {renderVideoPlayer()}
      </div>

      {currentSong && (
        <div className="flex items-center gap-4 mb-6">
            <div className="overflow-hidden">
                <p className="text-xl font-bold font-headline truncate">{currentSong.name}</p>
                <p className="text-muted-foreground truncate">{currentSong.artist}</p>
            </div>
            {isLoading && <Badge variant="secondary" className="ml-auto animate-pulse bg-accent/80 text-accent-foreground">Syncing...</Badge>}
        </div>
      )}
      
      <div className="flex-1 overflow-auto pr-2 -mr-2" ref={scrollContainerRef}>
        {isLoading ? (
          renderSkeletons()
        ) : chordData ? (
          renderLyricsAndChords()
        ) : (
          !currentSong && renderEmptyState()
        )}
      </div>
    </div>
  );
}
