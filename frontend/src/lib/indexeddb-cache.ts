// src/lib/indexeddb-cache.ts

import type { Song } from '@/types';

const DB_NAME = 'SelfMusicCache';
const DB_VERSION = 1;
const SONGS_STORE = 'songs';
const LYRICS_STORE = 'lyrics';

let db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(SONGS_STORE)) {
        db.createObjectStore(SONGS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(LYRICS_STORE)) {
        db.createObjectStore(LYRICS_STORE, { keyPath: 'songId' });
      }
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onerror = (event) => {
      console.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

export async function saveSongToCache(song: Song, audioBlob: Blob, imageBlob: Blob | null) {
  try {
    const database = await openDB();
    const transaction = database.transaction(SONGS_STORE, 'readwrite');
    const store = transaction.objectStore(SONGS_STORE);
    
    // Store song metadata, audio blob, and image blob
    const songData = {
      ...song,
      audioBlob: audioBlob, // Store the actual audio data
      imageBlob: imageBlob, // Store the actual image data
      cachedAt: new Date(),
    };
    store.put(songData);

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = (event) => reject((event.target as IDBTransaction).error);
    });
    console.log(`Song ${song.id} saved to IndexedDB. ImageBlob present: ${!!imageBlob}`);
  } catch (error) {
    console.error('Error saving song to IndexedDB:', error);
  }
}

export async function getSongFromCache(songId: string): Promise<{ song: Song; audioBlob: Blob; imageBlob: Blob | null } | null> {
  try {
    const database = await openDB();
    const transaction = database.transaction(SONGS_STORE, 'readonly');
    const store = transaction.objectStore(SONGS_STORE);
    const request = store.get(songId);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const songData = request.result;
        if (songData && songData.audioBlob) {
          console.log(`Song ${songId} retrieved from IndexedDB. ImageBlob present: ${!!songData.imageBlob}, size: ${songData.imageBlob?.size}`);
          const { audioBlob, imageBlob = null, ...song } = songData;
          resolve({ song, audioBlob, imageBlob });
        } else {
          resolve(null);
        }
      };
      request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  } catch (error) {
    console.error('Error getting song from IndexedDB:', error);
    return null;
  }
}

export async function saveLyricsToCache(songId: string, lyrics: string) {
  try {
    const database = await openDB();
    const transaction = database.transaction(LYRICS_STORE, 'readwrite');
    const store = transaction.objectStore(LYRICS_STORE);
    
    store.put({ songId, lyrics, cachedAt: new Date() });

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = (event) => reject((event.target as IDBTransaction).error);
    });
    console.log(`Lyrics for song ${songId} saved to IndexedDB.`);
  } catch (error) {
    console.error('Error saving lyrics to IndexedDB:', error);
  }
}

export async function getLyricsFromCache(songId: string): Promise<string | null> {
  try {
    const database = await openDB();
    const transaction = database.transaction(LYRICS_STORE, 'readonly');
    const store = transaction.objectStore(LYRICS_STORE);
    const request = store.get(songId);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const lyricData = request.result;
        if (lyricData && lyricData.lyrics) {
          console.log(`Lyrics for song ${songId} retrieved from IndexedDB.`);
          resolve(lyricData.lyrics);
        } else {
          resolve(null);
        }
      };
      request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  } catch (error) {
    console.error('Error getting lyrics from IndexedDB:', error);
    return null;
  }
}

export async function clearAllCache() {
  try {
    const database = await openDB();
    const songTransaction = database.transaction(SONGS_STORE, 'readwrite');
    const songStore = songTransaction.objectStore(SONGS_STORE);
    songStore.clear();
    await new Promise<void>((resolve, reject) => {
      songTransaction.oncomplete = () => resolve();
      songTransaction.onerror = (event) => reject((event.target as IDBTransaction).error);
    });

    const lyricsTransaction = database.transaction(LYRICS_STORE, 'readwrite');
    const lyricsStore = lyricsTransaction.objectStore(LYRICS_STORE);
    lyricsStore.clear();
    await new Promise<void>((resolve, reject) => {
      lyricsTransaction.oncomplete = () => resolve();
      lyricsTransaction.onerror = (event) => reject((event.target as IDBTransaction).error);
    });

    console.log('All IndexedDB caches cleared.');
  } catch (error) {
    console.error('Error clearing IndexedDB caches:', error);
  }
}
