'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/lib/store';
import { useSongsStore } from '@/lib/data-stores';
import { API_BASE_URL, api } from '@/lib/api';

export function AudioManager() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeUpdateRef = useRef<number | null>(null);
  const defaultTitleRef = useRef<string | null>(null);
  const currentAudioBlobUrl = useRef<string | null>(null);

  const {
    currentSong,
    isPlaying,
    volume,
    currentTime,
    repeatMode,
    shouldSeek,
    setCurrentTime,
    setDuration,
    pause,
    nextSong,
  } = usePlayerStore();

  const { recordPlay } = useSongsStore();
  const hasRecordedPlay = useRef<Set<string>>(new Set());

  // 处理时间跳转的回调函数
  const handleSeek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio || typeof time !== 'number' || isNaN(time)) return;
    
    audio.currentTime = time;
  }, []);

  // 初始化音频对象 - 只在组件挂载时执行一次
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioRef.current) {
      audioRef.current = new Audio();
      console.log('Audio element created');
    }

    // 记录初始标题
    if (typeof document !== 'undefined' && defaultTitleRef.current === null) {
      defaultTitleRef.current = document.title;
    }

    return () => {
      if (timeUpdateRef.current) {
        cancelAnimationFrame(timeUpdateRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (currentAudioBlobUrl.current) {
        URL.revokeObjectURL(currentAudioBlobUrl.current);
        currentAudioBlobUrl.current = null;
      }

      // 恢复标题
      if (typeof document !== 'undefined' && defaultTitleRef.current) {
        document.title = defaultTitleRef.current;
      }
    };
  }, []);

  // 根据播放状态与当前歌曲动态更新页面标题
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const baseTitle = defaultTitleRef.current || 'Self-Music - 音乐流媒体平台';

    if (currentSong && isPlaying) {
      const artistName = (typeof currentSong.artist === 'string')
        ? currentSong.artist
        : currentSong.artist?.name;
      const nowPlaying = `♪ 正在播放：${currentSong.title}${artistName ? ` - ${artistName}` : ''} | Self-Music`;
      document.title = nowPlaying;
    } else {
      document.title = baseTitle;
    }
  }, [currentSong, isPlaying]);

  // 设置音频事件监听器 - 只在音频元素创建后执行一次
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      console.log('Audio loaded metadata, duration:', audio.duration);
      if (audio.duration > 0 && audio.duration !== Infinity) {
        setDuration(audio.duration);
      }
    };

    const handleLoadedData = () => {
      console.log('Audio loaded data, duration:', audio.duration);
      if (audio.duration > 0 && audio.duration !== Infinity) {
        setDuration(audio.duration);
      }
    };

    const handleCanPlay = () => {
      console.log('Audio can play, duration:', audio.duration);
      if (audio.duration > 0 && audio.duration !== Infinity) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handlePlay = () => {
      console.log('Audio play event');
      
      // 开始定期更新时间
      const updateTime = () => {
        if (!audio.paused && !audio.ended) {
          setCurrentTime(audio.currentTime);
          timeUpdateRef.current = requestAnimationFrame(updateTime);
        }
      };
      timeUpdateRef.current = requestAnimationFrame(updateTime);
      
      // 记录播放量（仅为真实歌曲，且每首歌曲只记录一次）
      if (currentSong && currentSong.id !== 'demo-song-1' && !hasRecordedPlay.current.has(currentSong.id)) {
        console.log('Recording play for song:', currentSong.title);
        // 不等待 recordPlay 的结果，让它在后台执行，确保不影响播放
        recordPlay(currentSong.id).catch(error => {
          console.error('Failed to record play:', error);
        });
        hasRecordedPlay.current.add(currentSong.id);
      }
    };

    const handlePause = () => {
      console.log('Audio pause event');
      if (timeUpdateRef.current) {
        cancelAnimationFrame(timeUpdateRef.current);
        timeUpdateRef.current = null;
      }
    };

    const handleEnded = () => {
      console.log('Audio ended, repeat mode:', repeatMode);
      if (timeUpdateRef.current) {
        cancelAnimationFrame(timeUpdateRef.current);
        timeUpdateRef.current = null;
      }
      
      // 所有播放模式都通过 nextSong 函数统一处理
      nextSong();
    };

    const handleError = (error: Event) => {
      const audioElement = error.target as HTMLAudioElement;
      console.error('Audio error:', error);
      console.error('Audio error code:', audioElement?.error?.code);
      console.error('Audio error message:', audioElement?.error?.message);
      console.error('Audio source:', audio.src);
      
      // 根据错误代码提供更具体的错误信息
      if (audioElement?.error) {
        let errorMessage = '';
        switch (audioElement.error.code) {
          case 1: // MEDIA_ERR_ABORTED
            errorMessage = '音频加载被中止';
            break;
          case 2: // MEDIA_ERR_NETWORK
            errorMessage = '网络错误导致音频加载失败';
            break;
          case 3: // MEDIA_ERR_DECODE
            errorMessage = '音频文件解码失败';
            break;
          case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
            errorMessage = '不支持的音频格式或源';
            break;
          default:
            errorMessage = `未知错误 (${audioElement.error.code})`;
        }
        console.error('Audio error description:', errorMessage);
      }
      
      pause();
    };

    const handleSeeked = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('seeked', handleSeeked);

    return () => {
      if (timeUpdateRef.current) {
        cancelAnimationFrame(timeUpdateRef.current);
      }
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('seeked', handleSeeked);
    };
  }, [setCurrentTime, setDuration, pause, nextSong, currentSong, recordPlay]);

  // 处理歌曲切换
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;
    
    // 清理旧的 Blob URL
    if (currentAudioBlobUrl.current) {
      URL.revokeObjectURL(currentAudioBlobUrl.current);
      currentAudioBlobUrl.current = null;
    }

    // 当歌曲切换时，重置播放记录（允许重复播放同一首歌曲时记录播放量）
    if (currentSong.id && currentSong.id !== 'demo-song-1') {
      hasRecordedPlay.current.clear();
    }
    
    const loadAudio = async () => {
      setDuration(0); // Reset duration until new audio is loaded
      const result = await api.getSongWithCache(currentSong.id);

      if (result.success && result.data) {
        const songData = result.data;
        let audioSrc = '';

        if (songData.audioBlob) {
          // Use cached Blob
          audioSrc = URL.createObjectURL(songData.audioBlob);
          currentAudioBlobUrl.current = audioSrc;
          console.log('Using cached audio Blob for:', currentSong.title);
        } else {
          // Fallback to network stream if Blob not available (shouldn't happen if getSongWithCache works)
          audioSrc = `${API_BASE_URL}/songs/${currentSong.id}/stream`;
          console.log('Using network stream for:', currentSong.title);
        }

        if (audio.src !== audioSrc) {
          if (timeUpdateRef.current) {
            cancelAnimationFrame(timeUpdateRef.current);
            timeUpdateRef.current = null;
          }
          audio.src = audioSrc;
          audio.load();
          console.log('Audio source set to:', audioSrc);
        } else {
          if (audio.duration > 0 && audio.duration !== Infinity) {
            console.log('Same audio source, updating duration:', audio.duration);
            setDuration(audio.duration);
          }
        }
      } else {
        console.error('Failed to load song with cache:', result.error);
        // Optionally set an error state in the store
        pause();
      }
    };

    loadAudio();

  }, [currentSong, setDuration, pause]);

  // 监听音频加载完成事件，在音频准备好后根据播放状态决定是否自动播放
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    const handleCanPlay = () => {
      console.log('Audio can play, current isPlaying state:', isPlaying);
      // 如果当前应该播放且音频已准备好，则尝试播放
      if (isPlaying) {
        audio.play().catch((error) => {
          console.error('Auto-play error after canplay:', error);
          console.warn('Auto-play failed, possibly due to browser autoplay policy');
        });
      }
    };

    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [currentSong, isPlaying]);

  // 处理播放/暂停
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying && currentSong) {
      console.log('Attempting to play:', currentSong.title);
      
      // 检查音频是否已经准备好
      if (audio.readyState >= 2) { // HAVE_CURRENT_DATA or higher
        audio.play().catch((error) => {
          console.error('Play error:', error);
          console.error('Audio ready state:', audio.readyState);
          console.error('Audio src:', audio.src);
          console.warn('Playback failed, possibly due to browser autoplay policy');
        });
      } else {
        // 如果还没准备好，等待 canplay 事件
        const handleCanPlay = () => {
          audio.play().catch((error) => {
            console.error('Play error after canplay:', error);
            console.warn('Playback failed, possibly due to browser autoplay policy');
          });
          audio.removeEventListener('canplay', handleCanPlay);
        };
        
        audio.addEventListener('canplay', handleCanPlay);
        
        // 添加超时清理，防止内存泄漏
        const timeoutId = setTimeout(() => {
          audio.removeEventListener('canplay', handleCanPlay);
        }, 10000); // 10秒超时
        
        // 返回清理函数
        return () => {
          audio.removeEventListener('canplay', handleCanPlay);
          clearTimeout(timeoutId);
        };
      }
    } else {
      console.log('Pausing audio');
      audio.pause();
    }
  }, [isPlaying, currentSong, pause]);

  // 处理音量变化
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  // 处理用户主动的时间跳转请求
  useEffect(() => {
    if (shouldSeek !== null) {
      handleSeek(shouldSeek);
      // 清除 shouldSeek 标志，避免重复触发
      usePlayerStore.setState({ shouldSeek: null });
    }
  }, [shouldSeek, handleSeek]);

  // 暴露 handleSeek 函数供外部使用，移除自动触发的 useEffect
  // handleSeek 函数已经通过 handleSeek callback 暴露给外部组件使用

  // 这个组件不渲染任何可见内容，只管理音频播放
  return null;
}
