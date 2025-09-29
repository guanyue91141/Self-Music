'use client';

import { useState, useEffect } from 'react';
import { LyricsDisplay, LyricsCard } from '@/components/lyrics-display';
import { MobileLyricsDisplay } from '@/components/mobile-lyrics-display';
import { parseDualLRC, DualLyricLine } from '@/lib/lyrics-parser';
import { testDualLyrics } from '@/lib/test-dual-lyrics';

export default function DualLyricsTestPage() {
  const [dualLyrics, setDualLyrics] = useState<DualLyricLine[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // 解析双语歌词
    const parsedLyrics = parseDualLRC(testDualLyrics);
    setDualLyrics(parsedLyrics);

    // 模拟时间更新
    const interval = setInterval(() => {
      setCurrentTime(prev => {
        // 循环播放时间
        const newTime = prev + 0.5;
        if (newTime > (parsedLyrics[parsedLyrics.length - 1]?.time || 180)) {
          return 0;
        }
        return newTime;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleLyricClick = (time: number) => {
    setCurrentTime(time);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">双语歌词测试</h1>
        
        <div className="mb-4 p-4 bg-muted rounded-lg">
          <p className="text-center">当前播放时间: {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(2)}</p>
          <div className="w-full bg-primary/20 h-2 rounded-full mt-2">
            <div 
              className="bg-primary h-2 rounded-full" 
              style={{ width: `${Math.min(100, (currentTime / (dualLyrics[dualLyrics.length - 1]?.time || 180)) * 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 桌面版歌词显示 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">桌面版双语歌词</h2>
            <LyricsCard
              lyrics={dualLyrics}
              isDualLyrics
              currentTime={currentTime}
              onLyricClick={handleLyricClick}
              title="双语歌词"
              onFullscreen={() => setIsFullscreen(true)}
            />
          </div>

          {/* 移动版歌词显示 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">移动版双语歌词</h2>
            <div className="border rounded-lg p-4 bg-card">
              <MobileLyricsDisplay
                lyrics={dualLyrics}
                isDualLyrics
                currentTime={currentTime}
                onLyricClick={handleLyricClick}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* 全屏歌词显示 */}
        {isFullscreen && (
          <div className="fixed inset-0 bg-background z-50 p-4 flex items-center justify-center">
            <div className="w-full max-w-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">全屏歌词</h2>
                <button 
                  onClick={() => setIsFullscreen(false)}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <LyricsDisplay
                lyrics={dualLyrics}
                isDualLyrics
                currentTime={currentTime}
                onLyricClick={handleLyricClick}
                className="h-[70vh]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}