
'use client';

import React, { useEffect, useState } from 'react';
import { getFretboard } from '@/app/actions';
import { Skeleton } from '@/components/ui/skeleton';
import type { GenerateFretboardOutput } from '@/ai/flows/generate-fretboard';

interface FretboardDiagramProps {
  chord: string;
}

const FretboardDiagram: React.FC<FretboardDiagramProps> = ({ chord }) => {
  const [data, setData] = useState<GenerateFretboardOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFretboardData = async () => {
      if (!chord) return;
      setIsLoading(true);
      setError(null);
      const result = await getFretboard(chord);
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || 'Could not load diagram.');
        console.error(`Failed to get fretboard for ${chord}:`, result.error);
      }
      setIsLoading(false);
    };

    fetchFretboardData();
  }, [chord]);

  if (isLoading) {
    return <Skeleton className="w-[100px] h-[120px] bg-muted/50 rounded-md" />;
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center w-[100px] h-[120px] bg-muted/50 rounded-md text-xs text-muted-foreground p-2 text-center">
        {error || 'Diagram not available'}
      </div>
    );
  }

  const { frets } = data;
  const numStrings = 6;
  const numFrets = 5;
  const baseFret = Math.max(...frets) > numFrets ? Math.min(...frets.filter(f => f > 0)) : 1;
  const fretRange = Array.from({ length: numFrets + 1 }, (_, i) => i);
  const stringRange = Array.from({ length: numStrings }, (_, i) => i);

  return (
    <svg width="100" height="120" viewBox="0 0 100 120" className="bg-card rounded-md border">
      {fretRange.slice(1).map((fret) => (
        <line
          key={`fret-${fret}`}
          x1="10"
          y1={20 + (fret * 20)}
          x2="90"
          y2={20 + (fret * 20)}
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="1"
        />
      ))}

      <rect x="10" y="18" width="80" height={baseFret === 1 ? 4 : 0} fill="hsl(var(--foreground))" />

      {stringRange.map((string) => (
        <line
          key={`string-${string}`}
          x1={10 + (string * 16)}
          y1="20"
          x2={10 + (string * 16)}
          y2="120"
          stroke="hsl(var(--border))"
          strokeWidth="1"
        />
      ))}

      {baseFret > 1 && (
        <text x="98" y="40" textAnchor="end" fontSize="12" fill="hsl(var(--muted-foreground))">
          {baseFret}
        </text>
      )}

      {frets.map((fret, stringIndex) => {
        if (fret > 0) {
          const adjustedFret = fret - (baseFret > 1 ? baseFret - 1 : 0);
          if (adjustedFret <= numFrets) {
            return (
              <circle
                key={`dot-${stringIndex}`}
                cx={10 + ((numStrings - 1 - stringIndex) * 16)}
                cy={10 + (adjustedFret * 20)}
                r="6"
                fill="hsl(var(--primary))"
              />
            );
          }
        }
        return null;
      })}

      {frets.map((fret, stringIndex) => {
        const xPos = 10 + ((numStrings - 1 - stringIndex) * 16);
        if (fret === 0) {
          return (
            <circle
              key={`open-${stringIndex}`}
              cx={xPos}
              cy="10"
              r="4"
              stroke="hsl(var(--foreground))"
              strokeWidth="1.5"
              fill="none"
            />
          );
        }
        if (fret === -1) {
          return (
            <g key={`muted-${stringIndex}`}>
                <line x1={xPos - 4} y1="6" x2={xPos + 4} y2="14" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" />
                <line x1={xPos + 4} y1="6" x2={xPos - 4} y2="14" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" />
            </g>
          );
        }
        return null;
      })}
    </svg>
  );
};

export default FretboardDiagram;
