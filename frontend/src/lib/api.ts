import type { 
  Artist, 
  Album, 
  Song, 
  Playlist, 
  Mood, 
  ApiResponse, 
  PaginatedResponse, 
  SearchResult,
  RecommendationParams 
} from '@/types';
import { mockApi } from './mock-api';
import { API_BASE_URL } from './base_url_config';
import { getSongFromCache, saveSongToCache, getLyricsFromCache, saveLyricsToCache } from './indexeddb-cache';

const USE_MOCK_API = false;

// Real API Client Configuration
class RealApiClient {
  private baseURL: string;
  
  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getSongWithCache(id: string): Promise<ApiResponse<Song & { audioBlob?: Blob; imageBlob?: Blob | null; }>> {
    // 1. Try to get from IndexedDB cache
    const cached = await getSongFromCache(id);
    if (cached) {
      // If audioBlob is cached, check for imageBlob
      if (cached.imageBlob) {
        return { success: true, data: { ...cached.song, audioBlob: cached.audioBlob, imageBlob: cached.imageBlob } };
      } else if (cached.song.coverUrl) {
        // If imageBlob is missing but coverUrl exists, fetch and cache image
        try {
          const imageUrl = cached.song.coverUrl.startsWith('http') ? cached.song.coverUrl : `${this.baseURL}${cached.song.coverUrl}`;
          console.log('Attempting to fetch missing image from:', imageUrl);
          const imageResponse = await fetch(imageUrl);
          console.log('Missing image fetch response OK:', imageResponse.ok, 'Status:', imageResponse.status);
          if (imageResponse.ok) {
            const imageBlob = await imageResponse.blob();
            console.log('Missing Image Blob created, size:', imageBlob.size);
            await saveSongToCache(cached.song, cached.audioBlob, imageBlob); // Update existing cache entry
            return { success: true, data: { ...cached.song, audioBlob: cached.audioBlob, imageBlob } };
          }
        } catch (imgError) {
          console.warn('Failed to fetch missing image for caching:', imgError);
        }
      }
      // If imageBlob is still missing or fetch failed, return cached audio only
      return { success: true, data: { ...cached.song, audioBlob: cached.audioBlob, imageBlob: null } };
    }

    // 2. If not in cache, fetch from network
    try {
      // Fetch song metadata
      const songMetaResponse = await this.request<Song>(`/songs/${id}`);
      if (!songMetaResponse.success || !songMetaResponse.data) {
        return { success: false, error: songMetaResponse.error || 'Failed to fetch song metadata' };
      }
      let song = songMetaResponse.data;

      // Fetch audio as Blob
      const audioResponse = await fetch(`${this.baseURL}/songs/${id}/stream`);
      if (!audioResponse.ok) {
        throw new Error(`HTTP error fetching audio! status: ${audioResponse.status}`);
      }
      const audioBlob = await audioResponse.blob();

      // Fetch image as Blob
      let imageBlob: Blob | null = null;
      if (song.coverUrl) {
        try {
          const imageUrl = song.coverUrl.startsWith('http') ? song.coverUrl : `${this.baseURL}${song.coverUrl}`;
          console.log('Attempting to fetch image from:', imageUrl);
          const imageResponse = await fetch(imageUrl);
          console.log('Image fetch response OK:', imageResponse.ok, 'Status:', imageResponse.status);
          if (imageResponse.ok) {
            imageBlob = await imageResponse.blob();
            console.log('Image Blob created, type:', imageBlob.type, 'size:', imageBlob.size);
          }
        } catch (imgError) {
          console.warn('Failed to fetch image for caching:', imgError);
        }
      }

      // Fetch lyrics
      const lyricsResponse = await fetch(`${this.baseURL}/songs/${id}/lyrics`);
      let lyricsText = '';
      if (lyricsResponse.ok) {
        lyricsText = await lyricsResponse.text();
        song = { ...song, lyrics: lyricsText }; // Add lyrics to song object
      }

      // Save to cache
      console.log('Calling saveSongToCache with imageBlob (exists):', !!imageBlob, 'size:', imageBlob?.size);
      await saveSongToCache(song, audioBlob, imageBlob);
      if (lyricsText) {
        await saveLyricsToCache(id, lyricsText);
      }

      return { success: true, data: { ...song, audioBlob, imageBlob } };
    } catch (error) {
      console.error('Error in getSongWithCache:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getLyrics(songId: string): Promise<ApiResponse<string>> {
    // 1. Try to get from IndexedDB cache
    const cachedLyrics = await getLyricsFromCache(songId);
    if (cachedLyrics) {
      return { success: true, data: cachedLyrics };
    }

    // 2. If not in cache, fetch from network
    try {
      const response = await fetch(`${this.baseURL}/songs/${songId}/lyrics`);
      if (!response.ok) {
        throw new Error(`HTTP error fetching lyrics! status: ${response.status}`);
      }
      const lyricsText = await response.text();
      await saveLyricsToCache(songId, lyricsText);
      return { success: true, data: lyricsText };
    } catch (error) {
      console.error('Error in getLyrics:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Artists API
  async getArtists(page = 1, limit = 20): Promise<ApiResponse<PaginatedResponse<Artist>>> {
    return this.request(`/artists?page=${page}&limit=${limit}`);
  }

  async getArtist(id: string): Promise<ApiResponse<Artist>> {
    return this.request(`/artists/${id}`);
  }

  async getArtistSongs(id: string): Promise<ApiResponse<Song[]>> {
    return this.request(`/artists/${id}/songs`);
  }

  async getArtistAlbums(id: string): Promise<ApiResponse<Album[]>> {
    return this.request(`/artists/${id}/albums`);
  }

  // Albums API
  async getAlbums(page = 1, limit = 20): Promise<ApiResponse<PaginatedResponse<Album>>> {
    return this.request(`/albums?page=${page}&limit=${limit}`);
  }

  async getAlbum(id: string): Promise<ApiResponse<Album>> {
    return this.request(`/albums/${id}`);
  }

  async getAlbumSongs(id: string): Promise<ApiResponse<Song[]>> {
    return this.request(`/albums/${id}/songs`);
  }

  // Songs API
  async getSongs(page = 1, limit = 20, sortBy = 'created_desc'): Promise<ApiResponse<PaginatedResponse<Song>>> {
    return this.request(`/songs?page=${page}&limit=${limit}&sort_by=${sortBy}`);
  }

  async getSong(id: string): Promise<ApiResponse<Song>> {
    return this.request(`/songs/${id}`);
  }

  // Playlists API
  async getPlaylists(page = 1, limit = 20): Promise<ApiResponse<PaginatedResponse<Playlist>>> {
    return this.request(`/playlists?page=${page}&limit=${limit}`);
  }

  async getPlaylist(id: string): Promise<ApiResponse<Playlist>> {
    return this.request(`/playlists/${id}`);
  }

  async createPlaylist(playlist: Partial<Playlist>): Promise<ApiResponse<Playlist>> {
    return this.request('/playlists', {
      method: 'POST',
      body: JSON.stringify(playlist),
    });
  }

  async updatePlaylist(id: string, playlist: Partial<Playlist>): Promise<ApiResponse<Playlist>> {
    return this.request(`/playlists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(playlist),
    });
  }

  async deletePlaylist(id: string): Promise<ApiResponse<void>> {
    return this.request(`/playlists/${id}`, { method: 'DELETE' });
  }

  async addSongToPlaylist(playlistId: string, songId: string): Promise<ApiResponse<void>> {
    return this.request(`/playlists/${playlistId}/songs`, {
      method: 'POST',
      body: JSON.stringify({ songId }),
    });
  }

  async removeSongFromPlaylist(playlistId: string, songId: string): Promise<ApiResponse<void>> {
    return this.request(`/playlists/${playlistId}/songs/${songId}`, { method: 'DELETE' });
  }

  // Moods API
  async getMoods(): Promise<ApiResponse<Mood[]>> {
    return this.request('/moods');
  }

  async getMood(id: string): Promise<ApiResponse<Mood>> {
    return this.request(`/moods/${id}`);
  }

  async getMoodSongs(id: string, page = 1, limit = 20): Promise<ApiResponse<Song[] | PaginatedResponse<Song>>> {
    return this.request(`/moods/${id}/songs?page=${page}&limit=${limit}`);
  }

  // Search API
  async search(query: string): Promise<ApiResponse<SearchResult>> {
    return this.request(`/search?q=${encodeURIComponent(query)}`);
  }

  // Recommendations API
  async getRecommendations(params: RecommendationParams = {}): Promise<ApiResponse<Song[]>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });
    
    return this.request(`/recommendations?${queryParams.toString()}`);
  }

  async getSimilarSongs(songId: string, limit = 10): Promise<ApiResponse<Song[]>> {
    return this.request(`/songs/${songId}/similar?limit=${limit}`);
  }

  async getTrendingSongs(limit = 20): Promise<ApiResponse<Song[]>> {
    return this.request(`/trending/songs?limit=${limit}`);
  }

  async getHotSongs(limit = 20): Promise<ApiResponse<Song[]>> {
    return this.request(`/hot/songs?limit=${limit}`);
  }

  async getNewSongs(limit = 20): Promise<ApiResponse<Song[]>> {
    return this.request(`/new/songs?limit=${limit}`);
  }

  // Play tracking API
  async recordPlay(songId: string): Promise<ApiResponse<{ songId: string; playCount: number }>> {
    return this.request(`/songs/${songId}/play`, { method: 'POST' });
  }
}

// Create real API client instance
const realApi = new RealApiClient(API_BASE_URL);

// Export the appropriate API based on environment
export const api = USE_MOCK_API ? mockApi : realApi;

export { API_BASE_URL };

// Export individual API functions for convenience
export const {
  getArtists,
  getArtist,
  getArtistSongs,
  getArtistAlbums,
  getAlbums,
  getAlbum,
  getAlbumSongs,
  getSongs,
  getSong,
  getSongWithCache,
  getPlaylists,
  getPlaylist,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  getMoods,
  getMood,
  getMoodSongs,
  getLyrics,
  search,
  getRecommendations,
  getSimilarSongs,
  getTrendingSongs,
  getHotSongs,
  getNewSongs,
  recordPlay,
} = api;