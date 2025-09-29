"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePlayerStore } from '@/lib/store';
import { useDefaultSongLoader } from '@/lib/use-default-song-loader';
import { parseLRC, GroupedLyricLine } from '@/lib/lyrics-parser';
import { DEFAULT_LYRICS } from '@/lib/default-song';
import { Sidebar } from '@/components/sidebar';
import { PlayerLayout, PlayerLeftSection, PlayerRightSection } from '@/components/player-layout';
import { AlbumCover, SongInfo } from '@/components/song-info';
import { PlayerControls } from '@/components/player-controls';
import { LyricsCard, LyricsDisplay, LyricLine } from '@/components/lyrics-display';
import { FullscreenLyrics } from '@/components/fullscreen-lyrics';
import { ThemeToggle } from '@/components/theme-toggle';
import { AmbientGlow } from '@/components/ambient-glow';
import { api } from '@/lib/api';
import { PlaylistPanel } from '@/components/playlist-panel';
import { isModernBrowser } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/base_url_config';


export default function PlayClient() {
  const [isModern, setIsModern] = useState(true);

  useEffect(() => {
    setIsModern(isModernBrowser());
  }, []);

  // 自动加载默认歌曲
  useDefaultSongLoader();

  const {
    currentSong,
    isPlaying,
    volume,
    currentTime,
    duration,
    playlist,
    currentIndex,
    repeatMode,
    shuffleMode,
    isLoading,
    error,
    play,
    pause,
    nextSong,
    previousSong,
    setVolume,
    setCurrentTime,
    toggleRepeat,
    toggleShuffle,
    seekTo,
    canPlayNext,
    canPlayPrevious,
    initializePlaylist,
    setLoading,
    setError,
    setSong,
    setPlaylistWithInfo,
    replacePlaylistAndPlay,
  } = usePlayerStore();

  // 在页面加载时获取热门歌曲
  useEffect(() => {
    const fetchHotSongs = async () => {
      try {
        const response = await api.getHotSongs(50);
        if (response.success && response.data) {
          console.log(`获取到 ${response.data.length} 首热门歌曲`);
          // 在没有播放列表或当前播放列表为空的情况下，可以考虑使用热门歌曲作为默认播放列表
          if (playlist.length === 0) {
            // 使用热门歌曲创建虚拟播放列表，但不自动播放
            // 这里创建一个符合Playlist接口的对象
            const hotSongsPlaylist = {
              id: 'hot-songs-playlist',
              name: '热门歌曲',
              description: '系统推荐的热门歌曲',
              coverUrl: null,
              songs: response.data,
              songIds: response.data.map(song => song.id),
              songCount: response.data.length,
              playCount: 0,
              duration: response.data.reduce((total, song) => total + (song.duration || 0), 0),
              creator: 'system',
              isPublic: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            setPlaylistWithInfo(hotSongsPlaylist, 0);
          }
        } else {
          console.error('获取热门歌曲失败:', response.error);
        }
      } catch (error) {
        console.error('获取热门歌曲时发生错误:', error);
      }
    };

    fetchHotSongs();
  }, [playlist.length, setPlaylistWithInfo]);

  const [isFullscreenLyrics, setIsFullscreenLyrics] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const searchParams = useSearchParams();
  const handledParamsRef = useRef(false);

  // 初始化播放列表 - 新用户或没有播放列表时自动加载推荐列表
  useEffect(() => {
    initializePlaylist();
  }, [initializePlaylist]);

  // 处理通过链接参数指定的播放内容：?playlist=ID 或 ?music=ID / ?song=ID
  useEffect(() => {
    // 确保仅处理一次，且在路由参数变更时可再次处理
    if (!searchParams) return;

    const playlistId = searchParams.get('playlist');
    const songId = searchParams.get('music') || searchParams.get('song');

    if (!playlistId && !songId) return;

    // 避免重复处理相同参数
    if (handledParamsRef.current) return;
    handledParamsRef.current = true;

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);

        if (playlistId) {
          const res = await api.getPlaylist(playlistId);
          if (!cancelled) {
            if (res.success && res.data) {
              // 设置歌单后尝试自动播放（AudioManager 里会处理被拦截的情况）
              replacePlaylistAndPlay(res.data.songs, 0);
              // play();
            } else {
              setError(res.error || '无法加载指定的歌单');
            }
          }
        } else if (songId) {
          const res = await api.getSong(songId);
          if (!cancelled) {
            if (res.success && res.data) {
              // 用单曲替换当前播放列表，形成仅包含此歌曲的临时歌单
              replacePlaylistAndPlay([res.data], 0);
            } else {
              setError(res.error || '无法加载指定的歌曲');
            }
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '未知错误');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // 动态歌词数据 - 使用真实的歌词解析
  const currentLyrics = useMemo(() => {
    if (!currentSong) return [];

    // 如果是默认歌曲，使用解析后的歌词
    if (currentSong.id === 'demo-song-1') {
      return parseLRC(DEFAULT_LYRICS);
    }

    // 使用歌曲对象中的真实歌词
    if (currentSong.lyrics) {
      try {
        // 尝试解析 LRC 格式的歌词
        return parseLRC(currentSong.lyrics);
      } catch (error) {
        console.warn('Failed to parse lyrics as LRC, treating as plain text');
        // 如果不是 LRC 格式，按行分割并为每行分配时间戳
        const lines = currentSong.lyrics.split('\n').filter(line => line.trim());
        return lines.map((text, index) => ({
          time: index * 10, // 每行间隔10秒
          texts: [text.trim()]
        }));
      }
    }

    // 如果没有歌词，显示歌曲基本信息
    return [
      { time: 0, texts: [`♪ ${currentSong.title} ♪`] },
      { time: 10, texts: [`演唱：${currentSong.artist?.name || currentSong.artist}`] },
      { time: 20, texts: [`专辑：${currentSong.album?.title || currentSong.album || '单曲'}`] },
      { time: 30, texts: ['暂无歌词'] },
      { time: 40, texts: ['享受这美妙的旋律'] },
    ];
  }, [currentSong]);

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handlePrevious = () => {
    if (canPlayPrevious()) {
      previousSong();
    }
  };
  const handleNext = () => {
    if (canPlayNext()) {
      nextSong();
    }
  };
  const handleShuffle = () => toggleShuffle();
  const handleRepeat = () => toggleRepeat();
  const handleMute = () => setVolume(volume === 0 ? 0.75 : 0);
  const handleLike = () => {
    setIsLiked(!isLiked);
    console.log('Like song:', currentSong?.title, 'New state:', !isLiked);
  };
  const handleVolumeChange = (value: number[]) => setVolume(value[0] / 100);
  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    seekTo(newTime);
  };
  const handleLyricClick = (time: number) => {
    seekTo(time);
  };
  const handleFullscreenLyrics = () => setIsFullscreenLyrics(true);
  const handleCloseFullscreenLyrics = () => setIsFullscreenLyrics(false);

  // Spacebar toggles play/pause on Play page
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Space only; ignore when focused in editable/inputs/buttons/selects
      if (e.code !== 'Space' && e.key !== ' ') return;
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName?.toLowerCase();
        const editable = (target as HTMLElement).isContentEditable;
        if (editable || ['input', 'textarea', 'select', 'button'].includes(tag)) {
          return;
        }
      }
      e.preventDefault();
      handlePlayPause();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  // 默认显示歌曲信息，当没有选择歌曲时
  const displaySong = currentSong || {
    id: '1',
    title: '特定歌曲播放',
    artist: {
      id: 'artist-1',
      name: '艺术家名称',
      avatar: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop&crop=face',
      followers: 100000,
      songCount: 25,
      genres: ['流行', '摇滚'],
      verified: true,
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    },
    album: {
      id: '1',
      title: '十一月的萧邦',
      artist: {
        id: 'artist-1',
        name: '周杰伦',
        avatar: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop&crop=face',
        followers: 100000,
        songCount: 25,
        genres: ['华语流行'],
        verified: true,
        createdAt: '2005-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      artistId: '1',
      coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
      releaseDate: '2005-11-01',
      songCount: 12,
      duration: 3480,
      genre: '华语流行',
      description: '周杰伦第六张录音室专辑',
      createdAt: '2005-11-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    artistId: 'artist-1',
    albumId: 'album-1',
    duration: 204,
    moods: [{
      id: 'happy',
      name: '快乐',
      description: '充满活力和正能量的音乐',
      icon: 'Smile',
      color: 'from-yellow-400 to-orange-500',
      coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
      songCount: 124,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    }],
    moodIds: ['mood-1', 'mood-2'],
    coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=face',
    audioUrl: `${API_BASE_URL}/songs/stream`,
    playCount: 1000,
    liked: false,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  };

  // 当没有歌曲时显示默认歌词
  const defaultLyrics: GroupedLyricLine[] = [
    { time: 0, texts: ['欢迎使用 Self-Music'] },
    { time: 10, texts: ['你的专属音乐流媒体平台'] },
    { time: 20, texts: ['在这里发现更多美妙的音乐'] },
    { time: 30, texts: ['让音乐陪伴你的每一刻'] },
    { time: 40, texts: ['♪ 享受音乐带来的快乐 ♪'] },
  ];

  const displayLyrics: GroupedLyricLine[] = currentSong ? currentLyrics : defaultLyrics;

  return (
    <div className="h-full bg-background relative overflow-hidden lg:flex">
      {/* Dynamic Ambient Glow Background */}
      <AmbientGlow
        imageUrl={currentSong?.coverUrl || displaySong.coverUrl}
        intensity="medium"
        animated={isModern}
        className="fixed inset-0 z-0"
      />
      
      {/* Sidebar - Mobile: Fixed overlay, Desktop: Takes layout space */}
      <Sidebar />
      
      {/* Main Content - Full width on mobile, flex-1 on desktop */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Theme Toggle */}
        <div className="absolute top-4 right-4 z-30">
          <ThemeToggle />
        </div>

        {/* Player Layout */}
        <PlayerLayout className="pt-16 lg:pt-0">
          {/* Left Section - Album Cover and Song Info */}
          <PlayerLeftSection>
            {/* 移动设备上使用环绕布局，桌面设备保持原有布局 */}
            <div className="w-full lg:hidden">
              <SongInfo song={displaySong} layout="around" />
            </div>
            
            {/* 桌面设备保持原有布局 */}
            <div className="hidden lg:block">
              <AlbumCover song={displaySong} size="lg" />
              <SongInfo song={displaySong} />
            </div>
            
            {/* 移动设备上在进度条与图片之间显示歌词 */}
            <div className="w-full lg:hidden">
              <LyricsDisplay
                lyrics={displayLyrics}
                currentTime={currentTime}
                onLyricClick={handleLyricClick}
                compact={false}
                className="h-64 max-h-64 overflow-hidden"
              />
            </div>
          </PlayerLeftSection>

          {/* Right Section - Lyrics (仅桌面端显示) */}
          <PlayerRightSection className="hidden lg:flex">
            <LyricsCard
              lyrics={displayLyrics}
              currentTime={currentTime}
              onLyricClick={handleLyricClick}
              onFullscreen={handleFullscreenLyrics}
            />
          </PlayerRightSection>
        </PlayerLayout>

        {/* 固定底部控制组件 - 移动设备 */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-background/95 backdrop-blur-lg border-t border-border/50">
          <PlayerControls
            isPlaying={isPlaying}
            isShuffle={shuffleMode}
            repeatMode={repeatMode}
            isMuted={volume === 0}
            isLiked={isLiked}
            volume={volume * 100}
            currentTime={currentTime}
            duration={duration}
            onPlayPause={handlePlayPause}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onShuffle={handleShuffle}
            onRepeat={handleRepeat}
            onMute={handleMute}
            onLike={handleLike}
            onVolumeChange={handleVolumeChange}
            onSeek={handleSeek}
            onFullscreen={handleFullscreenLyrics}
            className="w-full p-4"
          />
        </div>

        {/* 桌面设备控制组件 - 保持原有位置 */}
        <div className="hidden lg:block">
          <PlayerControls
            isPlaying={isPlaying}
            isShuffle={shuffleMode}
            repeatMode={repeatMode}
            isMuted={volume === 0}
            isLiked={isLiked}
            volume={volume * 100}
            currentTime={currentTime}
            duration={duration}
            onPlayPause={handlePlayPause}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onShuffle={handleShuffle}
            onRepeat={handleRepeat}
            onMute={handleMute}
            onLike={handleLike}
            onVolumeChange={handleVolumeChange}
            onSeek={handleSeek}
            onFullscreen={handleFullscreenLyrics}
            className="w-full max-w-md mx-auto"
          />
        </div>
      </div>

      {/* Playlist Panel */}
      <PlaylistPanel />

      {/* Fullscreen Lyrics Modal */}
      <FullscreenLyrics
        lyrics={displayLyrics}
        currentTime={currentTime}
        onLyricClick={handleLyricClick}
        isOpen={isFullscreenLyrics}
        onClose={handleCloseFullscreenLyrics}
        songTitle={displaySong.title}
        artistName={displaySong.artist.name}
      />
    </div>
  );
}
