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
  triggerUpdate: () => {},
  setTriggerUpdate: (updater) => set({ triggerUpdate: updater }),
  checkForUpdate: () => {},
  setCheckForUpdate: (checker) => set({ checkForUpdate: checker }),
  fetchServiceWorkerVersion: async () => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration.active) {
          const messageChannel = new MessageChannel();
          messageChannel.port1.onmessage = (event) => {
            if (event.data && event.data.type === 'VERSION_RESPONSE') {
              console.log('当前版本:', event.data.version);
              set({ serviceWorkerVersion: event.data.version });
            }
          };
          registration.active.postMessage({ type: 'GET_VERSION' }, [messageChannel.port2]);
        }
      } catch (error) {
        console.error('Error fetching service worker version:', error);
      }
    }
  },
}));
