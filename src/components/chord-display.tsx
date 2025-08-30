
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
  const [activeMeasure, setActiveMeasure] = useState<{ line: number; measure: number } | null>(null);
  const [player, setPlayer] = useState<any>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const measureRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const { toast } = useToast();

  useEffect(() => {
    if (currentSong && !isLoading) {
      const fetchVideo = async () => {
        setIsFetchingVideo(true);
        setVideoId(null);
        setActiveMeasure(null);
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
        setActiveMeasure(null);
    }
  }, [currentSong, isLoading, toast]);

  useEffect(() => {
    if (!player || !chordData?.lines) return;

    const interval = setInterval(async () => {
      const currentTime = await player.getCurrentTime();
      if (!chordData?.lines) return;
      
      let currentMeasure: { line: number, measure: number } | null = null;
      let lastMeasure: { line: number, measure: number } | null = null;

      for (let lineIndex = 0; lineIndex < chordData.lines.length; lineIndex++) {
        const line = chordData.lines[lineIndex];
        for (let measureIndex = 0; measureIndex < line.measures.length; measureIndex++) {
            const measure = line.measures[measureIndex];
             if (currentTime >= measure.startTime) {
               lastMeasure = { line: lineIndex, measure: measureIndex };
             }
        }
      }
      currentMeasure = lastMeasure;

      if (currentMeasure && (currentMeasure.line !== activeMeasure?.line || currentMeasure.measure !== activeMeasure?.measure)) {
        setActiveMeasure(currentMeasure);
      }
    }, 250);

    return () => clearInterval(interval);

  }, [player, chordData, activeMeasure]);

   useEffect(() => {
    if (activeMeasure) {
      const key = `${activeMeasure.line}-${activeMeasure.measure}`;
      const measureElement = measureRefs.current.get(key);
      if (measureElement && scrollContainerRef.current) {
        const lineElement = measureElement.parentElement;
        const scrollContainer = scrollContainerRef.current;
        if (!lineElement) return;

        // Check if the line is already in view
        const lineRect = lineElement.getBoundingClientRect();
        const containerRect = scrollContainer.getBoundingClientRect();
        
        const isVisible = lineRect.top >= containerRect.top && lineRect.bottom <= containerRect.bottom;

        if (!isVisible) {
          lineElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }
    }
  }, [activeMeasure]);


  const renderLyricsAndChords = () => {
    if (!chordData?.lines) return null;
    
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {chordData.lines.map((line, lineIndex) => (
          <div key={lineIndex} className="p-2 rounded-lg transition-all duration-300">
            <div className="flex flex-wrap items-end gap-x-2 text-sm min-h-[1em]">
              {line.measures.map((measure, measureIndex) => {
                 const key = `${lineIndex}-${measureIndex}`;
                 const isActive = activeMeasure?.line === lineIndex && activeMeasure?.measure === measureIndex;
                 return (
                    <span 
                        key={key}
                        ref={el => measureRefs.current.set(key, el)}
                        className={`font-code font-bold p-1 rounded-md transition-all duration-150 ${
                            isActive
                                ? 'bg-primary text-primary-foreground scale-110'
                                : 'bg-primary/10 text-primary'
                        }`}
                    >
                      {measure.chords || ' '}
                    </span>
                 )
              })}
            </div>
            <p className="text-foreground text-lg mt-1">{line.lyrics || ' '}</p>
          </div>
        ))}
      </div>
    );
  }

  const renderSkeletons = () => (
    <div className="space-y-6">
       {[...Array(8)].map((_, i) => (
         <div key={i} className="space-y-2">
            <div className="flex gap-2">
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
                if (!activeMeasure) {
                  setActiveMeasure({ line: 0, measure: 0 });
                }
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
