import { create } from 'zustand';

interface PWAState {
  updateAvailable: boolean;
  serviceWorkerVersion: string | null;
  remoteVersion: string | null;
  setUpdateAvailable: (available: boolean) => void;
  setRemoteVersion: (version: string | null) => void;
  triggerUpdate: () => void;
  setTriggerUpdate: (updater: () => void) => void;
  fetchServiceWorkerVersion: () => void;
  checkForUpdate: () => void;
  setCheckForUpdate: (checker: () => void) => void;
}

export const usePWAStore = create<PWAState>((set) => ({
  updateAvailable: false,
  serviceWorkerVersion: null,
  remoteVersion: null,
  setUpdateAvailable: (available) => set({ updateAvailable: available }),
  setRemoteVersion: (version) => set({ remoteVersion: version }),
  triggerUpdate: () => {
    // 不执行任何操作，因为我们不再使用Service Worker
  },
  setTriggerUpdate: (updater) => set({ triggerUpdate: updater }),
  checkForUpdate: () => {
    // 不执行任何操作，因为我们不再使用Service Worker
  },
  setCheckForUpdate: (checker) => set({ checkForUpdate: checker }),
  fetchServiceWorkerVersion: () => {
    // 不执行任何操作，因为我们不再使用Service Worker
  },
}));