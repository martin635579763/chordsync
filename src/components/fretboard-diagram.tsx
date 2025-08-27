
'use client';

import React from 'react';

// A mapping of common chord names to their fingerings.
// -1 represents a muted string. 0 represents an open string.
// `frets` are the fret numbers for strings EADGBe
// `fingers` are the suggested fingerings (1-4) for the fretted notes.
const chordData: Record<string, { frets: number[]; fingers: number[] }> = {
    'C': { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
    'G': { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
    'Am': { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
    'Em': { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
    'F': { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1] }, // Barre chord
    'D': { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
    'E': { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
    'A': { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
    'Dm': { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
    'G7': { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
    'C7': { frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
    'Bm': { frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1] }, // Barre chord
};

interface FretboardDiagramProps {
  chord: string;
}

const FretboardDiagram: React.FC<FretboardDiagramProps> = ({ chord }) => {
  const data = chordData[chord];
  const numStrings = 6;
  const numFrets = 5;

  if (!data) {
    return (
      <div className="flex items-center justify-center w-[100px] h-[120px] bg-muted/50 rounded-md text-xs text-muted-foreground">
        Diagram not available
      </div>
    );
  }

  const { frets } = data;
  const baseFret = Math.max(...frets) > numFrets ? Math.min(...frets.filter(f => f > 0)) : 1;
  const fretRange = Array.from({ length: numFrets + 1 }, (_, i) => i); // 0 to 5
  const stringRange = Array.from({ length: numStrings }, (_, i) => i); // 0 to 5

  return (
    <svg width="100" height="120" viewBox="0 0 100 120" className="bg-card rounded-md border">
      {/* Frets */}
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

      {/* Nut */}
       <rect x="10" y="18" width="80" height={baseFret === 1 ? 4 : 0} fill="hsl(var(--foreground))" />


      {/* Strings */}
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

       {/* Base Fret Number */}
      {baseFret > 1 && (
        <text x="98" y="40" textAnchor="end" fontSize="12" fill="hsl(var(--muted-foreground))">
          {baseFret}
        </text>
      )}

      {/* Finger positions */}
      {frets.map((fret, stringIndex) => {
        if (fret > 0) {
          const adjustedFret = fret - (baseFret > 1 ? baseFret - 1 : 0);
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
        return null;
      })}

      {/* Open/Muted strings indicator */}
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
