
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
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
  const [activeMeasureKey, setActiveMeasureKey] = useState<string | null>(null);
  const [player, setPlayer] = useState<any>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const measureRefs = useRef<Map<string, HTMLSpanElement | null>>(new Map());
  const { toast } = useToast();

  const allMeasures = useMemo(() => {
    if (!chordData?.lines) return [];
    return chordData.lines.flatMap((line, lineIndex) => 
      line.measures.map((measure, measureIndex) => ({
        ...measure,
        key: `${lineIndex}-${measureIndex}`
      }))
    );
  }, [chordData]);


  useEffect(() => {
    if (currentSong && !isLoading) {
      const fetchVideo = async () => {
        setIsFetchingVideo(true);
        setVideoId(null);
        setActiveMeasureKey(null);
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
        setActiveMeasureKey(null);
    }
  }, [currentSong, isLoading, toast]);

  useEffect(() => {
    if (!player || !allMeasures.length) return;

    const interval = setInterval(async () => {
      const currentTime = await player.getCurrentTime();
      if (!allMeasures.length) return;
      
      let newActiveMeasureKey: string | null = null;
      let lastMeasureKey: string | null = null;
      
      for (const measure of allMeasures) {
        if (currentTime >= measure.startTime) {
          lastMeasureKey = measure.key;
        } else {
          newActiveMeasureKey = lastMeasureKey;
          break; // Exit loop once we are past the current time
        }
      }

      // If the loop finishes, it means we are in the last measure
      if (newActiveMeasureKey === null) {
        newActiveMeasureKey = lastMeasureKey;
      }


      if (newActiveMeasureKey && newActiveMeasureKey !== activeMeasureKey) {
        setActiveMeasureKey(newActiveMeasureKey);
      }
    }, 250);

    return () => clearInterval(interval);

  }, [player, allMeasures, activeMeasureKey]);

   useEffect(() => {
    if (activeMeasureKey) {
      const measureElement = measureRefs.current.get(activeMeasureKey);
      if (measureElement && scrollContainerRef.current) {
        const scrollContainer = scrollContainerRef.current;
        const containerRect = scrollContainer.getBoundingClientRect();
        const elementRect = measureElement.getBoundingClientRect();

        const isVisible = 
            elementRect.left >= containerRect.left &&
            elementRect.right <= containerRect.right;
        
        if (!isVisible) {
          measureElement.scrollIntoView({
            behavior: 'smooth',
            inline: 'center',
            block: 'nearest',
          });
        }
      }
    }
  }, [activeMeasureKey]);


  const renderChords = () => {
    if (!allMeasures.length) return null;
    
    return (
      <div 
        ref={scrollContainerRef}
        className="flex flex-nowrap items-center gap-x-2 text-lg overflow-x-auto p-4 rounded-lg bg-background/50 animate-in fade-in duration-500"
        style={{ scrollbarWidth: 'none', '-ms-overflow-style': 'none' }}
      >
        {allMeasures.map((measure) => {
           const isActive = activeMeasureKey === measure.key;
           return (
              <span 
                  key={measure.key}
                  ref={el => measureRefs.current.set(measure.key, el)}
                  className={`font-code font-bold p-2 rounded-md transition-all duration-150 shrink-0 ${
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
    );
  }

  const renderSkeletons = () => (
    <div className="flex items-center gap-x-2 p-4">
       {[...Array(8)].map((_, i) => (
         <Skeleton key={i} className="h-12 w-20 bg-muted/50 shrink-0" />
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
                if (!activeMeasureKey) {
                   const firstKey = allMeasures[0]?.key;
                   if (firstKey) setActiveMeasureKey(firstKey);
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
      
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          renderSkeletons()
        ) : chordData ? (
          renderChords()
        ) : (
          !currentSong && renderEmptyState()
        )}
      </div>
    </div>
  );
}

    