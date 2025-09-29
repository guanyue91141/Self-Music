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
    console.log('pwa-store: fetchServiceWorkerVersion called.');
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        console.log('pwa-store: Service Worker registration ready.', registration);
        if (registration.active) {
          console.log('pwa-store: Active Service Worker found.', registration.active);
          const messageChannel = new MessageChannel();
          messageChannel.port1.onmessage = (event) => {
            if (event.data && event.data.type === 'VERSION_RESPONSE') {
              console.log('pwa-store: Received VERSION_RESPONSE.', event.data.version);
              set({ serviceWorkerVersion: event.data.version });
            }
          };
          registration.active.postMessage({ type: 'GET_VERSION' }, [messageChannel.port2]);
          console.log('pwa-store: GET_VERSION message posted.');
        } else {
          console.log('pwa-store: No active Service Worker found.');
        }
      } catch (error) {
        console.error('pwa-store: Error fetching service worker version:', error);
      }
    } else {
      console.log('pwa-store: Service Worker not supported or not in browser environment.');
    }
  },
}));
