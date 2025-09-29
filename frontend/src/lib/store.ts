import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Song, PlayerState, Playlist } from '@/types';
import { DEFAULT_SONG } from './default-song';
import { PlaylistManager, PlaylistState } from './playlist-manager';
import { useSongsStore } from './data-stores';
import { api } from './api';

interface PlayerStore extends PlayerState {
  // Additional state
  currentPlaylist: Playlist | null;
  playbackMode: 'song' | 'playlist' | 'mood';
  currentMood: string | null;
  isLoading: boolean;
  error: string | null;
  shouldSeek: number | null; // 用于触发音频跳转
  
  // Actions
  setSong: (song: Song) => void;
  setPlaylist: (songs: Song[], currentIndex?: number) => void;
  setPlaylistWithInfo: (playlist: Playlist, currentIndex?: number) => void;
  setMoodPlaylist: (mood: string, songs: Song[], currentIndex?: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  nextSong: () => void;
  previousSong: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  seekTo: (time: number) => void;
  playFromPlaylist: (playlistId: string, songIndex?: number) => void;
  playFromMood: (mood: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Enhanced playlist management
  addToPlaylist: (song: Song) => void;
  removeFromPlaylist: (songId: string) => void;
  clearPlaylist: () => void;
  shufflePlaylist: () => void;
  moveSongInPlaylist: (fromIndex: number, toIndex: number) => void;
  
  // New audio-related actions
  canPlayNext: () => boolean;
  canPlayPrevious: () => boolean;
  loadDefaultSong: () => void;
  
  // New playlist manager integration
  initializePlaylist: () => Promise<void>;
  loadPlaylistFromStorage: () => void;
  jumpToSong: (songId: string) => void;
  replacePlaylistAndPlay: (songs: Song[], songIndex?: number) => void;
}

export const usePlayerStore = create<PlayerStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentSong: null,
      isPlaying: false,
      volume: 0.7,
      currentTime: 0,
      duration: 0,
      playlist: [],
      currentIndex: -1,
      repeatMode: 'none',
      shuffleMode: false,
      currentPlaylist: null,
      playbackMode: 'song',
      currentMood: null,
      isLoading: false,
      error: null,
      shouldSeek: null,

      // Actions
      setSong: async (song) => {
        const { currentSong, duration } = get();
        const isSameSong = currentSong && currentSong.id === song.id;

        set({ isLoading: true });
        try {
          const result = await api.getSongWithCache(song.id);
          if (result.success && result.data) {
            const { audioBlob, imageBlob, ...songData } = result.data;
            let imageBlobUrl: string | undefined;
            if (imageBlob) {
              imageBlobUrl = URL.createObjectURL(imageBlob);
            }
            const songWithCache = { ...songData, lyrics: songData.lyrics || song.lyrics, imageBlobUrl };
            set({
              currentSong: songWithCache,
              currentTime: 0,
              duration: isSameSong ? duration : 0,
              playbackMode: 'song',
              currentPlaylist: null,
              currentMood: null,
              isLoading: false,
              isPlaying: true, // Auto-play after loading new song
            });
          } else {
            set({ 
              currentSong: song, 
              currentTime: 0, 
              duration: isSameSong ? duration : 0, 
              playbackMode: 'song',
              currentPlaylist: null,
              currentMood: null,
              isLoading: false,
              error: result.error || 'Failed to load song with cache',
            });
          }
        } catch (err) {
          set({ 
            currentSong: song, 
            currentTime: 0, 
            duration: isSameSong ? duration : 0, 
            playbackMode: 'song',
            currentPlaylist: null,
            currentMood: null,
            isLoading: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      },

      setPlaylist: (songs, currentIndex = 0) => {
        const { currentSong, duration } = get();
        const validIndex = Math.max(0, Math.min(currentIndex, songs.length - 1));
        const newSong = songs[validIndex] || null;
        const isSameSong = currentSong && newSong && currentSong.id === newSong.id;
        
        set({
          playlist: songs,
          currentIndex: validIndex,
          currentSong: newSong,
          currentTime: 0,
          duration: isSameSong ? duration : 0, 
          playbackMode: 'playlist',
        });
        
        PlaylistManager.updatePlaylist(songs, validIndex, newSong?.id);
      },

      setPlaylistWithInfo: (playlist, currentIndex = 0) => {
        const { currentSong, duration } = get();
        const validIndex = Math.max(0, Math.min(currentIndex, playlist.songs.length - 1));
        const newSong = playlist.songs[validIndex] || null;
        const isSameSong = currentSong && newSong && currentSong.id === newSong.id;
        
        set({
          playlist: playlist.songs,
          currentIndex: validIndex,
          currentSong: newSong,
          currentTime: 0,
          duration: isSameSong ? duration : 0, 
          currentPlaylist: playlist,
          playbackMode: 'playlist',
          currentMood: null,
        });
      },

      setMoodPlaylist: (mood, songs, currentIndex = 0) => {
        const { currentSong, duration } = get();
        const validIndex = Math.max(0, Math.min(currentIndex, songs.length - 1));
        const newSong = songs[validIndex] || null;
        const isSameSong = currentSong && newSong && currentSong.id === newSong.id;
        
        set({
          playlist: songs,
          currentIndex: validIndex,
          currentSong: newSong,
          currentTime: 0,
          duration: isSameSong ? duration : 0, 
          playbackMode: 'mood',
          currentMood: mood,
          currentPlaylist: null,
        });
      },

      play: () => set({ isPlaying: true }),
      pause: () => set({ isPlaying: false }),
      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

      setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
      setCurrentTime: (currentTime) => set({ currentTime }),
      setDuration: (duration) => set({ duration }),

      nextSong: () => {
        const { repeatMode, shuffleMode, currentSong, duration, isPlaying } = get();
        const nextSong = PlaylistManager.getNextSong(shuffleMode, repeatMode);
        
        if (nextSong) {
          const updatedPlaylist = PlaylistManager.getCurrentPlaylist();
          const isSameSong = currentSong && currentSong.id === nextSong.id;
          
          set({
            currentSong: nextSong,
            currentTime: 0, 
            duration: isSameSong ? duration : 0, 
            // 不再强制设置 isPlaying: true，保持当前的播放状态
            // isPlaying: true, 
            ...(updatedPlaylist && {
              playlist: updatedPlaylist.songs,
              currentIndex: updatedPlaylist.currentIndex
            })
          });
        } else {
          console.log('Playlist ended, stopping playback');
          set({ isPlaying: false });
        }
      },

      previousSong: () => {
        const { currentSong, duration, isPlaying } = get();
        const prevSong = PlaylistManager.getPreviousSong();
        
        if (prevSong) {
          const updatedPlaylist = PlaylistManager.getCurrentPlaylist();
          const isSameSong = currentSong && currentSong.id === prevSong.id;
          
          set({
            currentSong: prevSong,
            currentTime: 0,
            duration: isSameSong ? duration : 0, 
            // 不再强制设置 isPlaying: true，保持当前的播放状态
            // isPlaying: true, 
            ...(updatedPlaylist && {
              playlist: updatedPlaylist.songs,
              currentIndex: updatedPlaylist.currentIndex
            })
          });
        }
      },

      toggleRepeat: () => {
        const { repeatMode } = get();
        const modes: PlayerState['repeatMode'][] = ['none', 'all', 'one'];
        const currentIndex = modes.indexOf(repeatMode);
        const nextMode = modes[(currentIndex + 1) % modes.length];
        set({ repeatMode: nextMode });
      },

      toggleShuffle: () => {
        set((state) => ({ shuffleMode: !state.shuffleMode }));
      },

      seekTo: (time) => {
        const { duration } = get();
        const clampedTime = Math.max(0, Math.min(time, duration || time));
        set({ shouldSeek: clampedTime });
      },

      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),

      canPlayNext: () => {
        const { shuffleMode, repeatMode } = get();
        return PlaylistManager.canPlayNext(shuffleMode, repeatMode);
      },

      canPlayPrevious: () => {
        return PlaylistManager.canPlayPrevious();
      },

      playFromPlaylist: async (playlistId, songIndex = 0) => {
        console.log(`Playing from playlist: ${playlistId}, song index: ${songIndex}`);
      },

      playFromMood: async (mood) => {
        console.log(`Playing mood: ${mood}`);
      },

      addToPlaylist: (song) => {
        const { playlist } = get();
        const newPlaylist = [...playlist, song];
        set({ playlist: newPlaylist });
        
        const currentPlaylist = PlaylistManager.getCurrentPlaylist();
        if (currentPlaylist) {
          PlaylistManager.updatePlaylist(newPlaylist, currentPlaylist.currentIndex);
        }
      },

      removeFromPlaylist: (songId) => {
        const { playlist, currentIndex } = get();
        const newPlaylist = playlist.filter(s => s.id !== songId);
        
        let newCurrentIndex = currentIndex;
        if (currentIndex >= newPlaylist.length) {
          newCurrentIndex = Math.max(0, newPlaylist.length - 1);
        }
        
        set({ 
          playlist: newPlaylist,
          currentIndex: newCurrentIndex,
          currentSong: newPlaylist[newCurrentIndex] || null 
        });
        
        PlaylistManager.updatePlaylist(newPlaylist, newCurrentIndex);
      },

      clearPlaylist: () => {
        set({ 
          playlist: [], 
          currentIndex: -1, 
          currentSong: null,
          isPlaying: false 
        });
        PlaylistManager.clearCurrentPlaylist();
      },

      shufflePlaylist: () => {
        const shuffledPlaylistState = PlaylistManager.shufflePlaylist();
        if (shuffledPlaylistState) {
          set({
            playlist: shuffledPlaylistState.songs,
            currentIndex: shuffledPlaylistState.currentIndex,
            currentSong: shuffledPlaylistState.songs[shuffledPlaylistState.currentIndex],
            shuffleMode: true
          });
        }
      },

      moveSongInPlaylist: (fromIndex, toIndex) => {
        const { playlist, currentIndex } = get();
        if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || 
            fromIndex >= playlist.length || toIndex >= playlist.length) return;
        
        const newPlaylist = [...playlist];
        const [movedSong] = newPlaylist.splice(fromIndex, 1);
        newPlaylist.splice(toIndex, 0, movedSong);
        
        let newCurrentIndex = currentIndex;
        if (fromIndex === currentIndex) {
          newCurrentIndex = toIndex;
        } else if (fromIndex < currentIndex && toIndex >= currentIndex) {
          newCurrentIndex = currentIndex - 1;
        } else if (fromIndex > currentIndex && toIndex <= currentIndex) {
          newCurrentIndex = currentIndex + 1;
        }
        
        set({ 
          playlist: newPlaylist,
          currentIndex: newCurrentIndex,
          currentSong: newPlaylist[newCurrentIndex]
        });
        
        PlaylistManager.updatePlaylist(newPlaylist, newCurrentIndex);
      },

      loadDefaultSong: () => {
        set({
          currentSong: DEFAULT_SONG,
          currentTime: 0,
          duration: 0, 
          isPlaying: false,
          playbackMode: 'song',
          currentPlaylist: null,
          currentMood: null,
        });
      },

      initializePlaylist: async () => {
        set({ isLoading: true });
        
        try {
          const existingPlaylist = PlaylistManager.getCurrentPlaylist();
          
          if (existingPlaylist && existingPlaylist.songs.length > 0) {
            set({
              playlist: existingPlaylist.songs,
              currentIndex: existingPlaylist.currentIndex,
              currentSong: existingPlaylist.songs[existingPlaylist.currentIndex] || null,
              playbackMode: 'playlist',
              isLoading: false,
            });
          } else {
            const defaultPlaylist = await PlaylistManager.initializeDefaultPlaylist();
            
            if (defaultPlaylist) {
              set({
                playlist: defaultPlaylist.songs,
                currentIndex: defaultPlaylist.currentIndex,
                currentSong: defaultPlaylist.songs[defaultPlaylist.currentIndex] || null,
                playbackMode: 'playlist',
                isLoading: false,
              });
            } else {
              set({
                currentSong: DEFAULT_SONG,
                currentTime: 0,
                duration: DEFAULT_SONG.duration,
                isPlaying: false,
                playbackMode: 'song',
                isLoading: false,
              });
            }
          }
        } catch (error) {
          console.error('Error initializing playlist:', error);
          set({
            currentSong: DEFAULT_SONG,
            currentTime: 0,
            duration: DEFAULT_SONG.duration,
            isPlaying: false,
            playbackMode: 'song',
            isLoading: false,
            error: 'Failed to load playlist',
          });
        }
      },

      loadPlaylistFromStorage: () => {
        const storedPlaylist = PlaylistManager.getCurrentPlaylist();
        
        if (storedPlaylist) {
          set({
            playlist: storedPlaylist.songs,
            currentIndex: storedPlaylist.currentIndex,
            currentSong: storedPlaylist.songs[storedPlaylist.currentIndex] || null,
            playbackMode: 'playlist',
          });
        }
      },

      jumpToSong: (songId) => {
        const { currentSong, duration } = get();
        const song = PlaylistManager.jumpToSong(songId);
        
        if (song) {
          const storedPlaylist = PlaylistManager.getCurrentPlaylist();
          const isSameSong = currentSong && currentSong.id === song.id;
          
          if (storedPlaylist) {
            set({
              playlist: storedPlaylist.songs,
              currentIndex: storedPlaylist.currentIndex,
              currentSong: song,
              currentTime: 0,
              duration: isSameSong ? duration : 0, 
            });
          }
        }
      },

      replacePlaylistAndPlay: (songs, songIndex = 0) => {
        const { currentSong, duration } = get();
        const validIndex = Math.max(0, Math.min(songIndex, songs.length - 1));
        const newSong = songs[validIndex] || null;
        const isSameSong = currentSong && newSong && currentSong.id === newSong.id;
        const playlistState = PlaylistManager.updatePlaylist(songs, validIndex);
        
        set({
          playlist: songs,
          currentIndex: validIndex,
          currentSong: newSong,
          currentTime: 0,
          duration: isSameSong ? duration : 0, 
          playbackMode: 'playlist',
          isPlaying: true, 
        });
      },
    }),
    {
      name: 'player-store',
    }
  )
);