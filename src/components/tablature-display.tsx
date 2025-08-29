
'use client';

import React from 'react';

interface TablatureDisplayProps {
  tablature?: string[];
}

const STRING_NAMES = ['e', 'B', 'G', 'D', 'A', 'E'];

const TablatureDisplay: React.FC<TablatureDisplayProps> = ({ tablature }) => {
  if (!tablature || tablature.length !== 6) {
    return (
        <div className="font-code text-xs text-muted-foreground/50 h-[72px] flex items-center justify-center">
            -
        </div>
    );
  }

  return (
    <div className="font-code text-xs text-foreground bg-muted/20 p-1 rounded-sm">
      {tablature.map((line, index) => (
        <div key={index} className="flex items-center">
          <span className="text-muted-foreground">{STRING_NAMES[index]}|</span>
          <span className="tracking-widest">{line}</span>
          <span>|</span>
        </div>
      ))}
    </div>
  );
};

export default TablatureDisplay;
