'use client';

import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LyricLine {
  time: number;
  text: string;
}

interface MobileLyricsDisplayProps {
  lyrics: LyricLine[];
  currentTime: number;
  onLyricClick?: (time: number) => void;
  className?: string;
}

export function MobileLyricsDisplay({
  lyrics,
  currentTime,
  onLyricClick,
  className,
}: MobileLyricsDisplayProps) {
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const [isExpanded, setIsExpanded] = useState(false);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  // 找到当前时间对应的歌词行
  useEffect(() => {
    if (lyrics.length === 0) return;

    let newIndex = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (lyrics[i].time <= currentTime) {
        newIndex = i;
      } else {
        break;
      }
    }
    setCurrentLineIndex(newIndex);
  }, [currentTime, lyrics]);

  // 自动滚动到当前歌词
  useEffect(() => {
    if (lyricsContainerRef.current && currentLineIndex >= 0) {
      const container = lyricsContainerRef.current;
      const activeElement = container.children[currentLineIndex] as HTMLElement;
      
      if (activeElement) {
        const containerHeight = container.clientHeight;
        const elementTop = activeElement.offsetTop;
        const elementHeight = activeElement.clientHeight;
        const scrollTop = elementTop - containerHeight / 2 + elementHeight / 2;
        
        container.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
      }
    }
  }, [currentLineIndex]);

  if (lyrics.length === 0) {
    return (
      <div className={cn(
        "flex items-center justify-center h-16 text-muted-foreground text-sm",
        className
      )}>
        暂无歌词
      </div>
    );
  }

  return (
    <div className={cn(
      "relative overflow-hidden",
      isExpanded ? "h-32" : "h-16",
      className
    )}>
      <div 
        ref={lyricsContainerRef}
        className="h-full overflow-y-auto scrollbar-hide"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="space-y-2 px-2 py-2">
          {lyrics.map((lyric, index) => {
            const isActive = index === currentLineIndex;
            const isNearActive = Math.abs(index - currentLineIndex) <= 1;
            
            return (
              <motion.div
                key={index}
                className={cn(
                  "text-center transition-all duration-300",
                  isActive 
                    ? "text-foreground font-medium text-base" 
                    : isNearActive
                    ? "text-muted-foreground text-sm"
                    : "text-muted-foreground/50 text-xs"
                )}
                initial={{ opacity: 0, y: 10 }}
                animate={{ 
                  opacity: isNearActive ? 1 : 0.3,
                  y: 0,
                  scale: isActive ? 1.05 : 1
                }}
                transition={{ duration: 0.3 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onLyricClick) {
                    onLyricClick(lyric.time);
                  }
                }}
              >
                {lyric.text}
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {/* 展开/收起指示器 */}
      <div className="absolute bottom-1 right-2">
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-muted-foreground/50"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        </motion.div>
      </div>
    </div>
  );
} 