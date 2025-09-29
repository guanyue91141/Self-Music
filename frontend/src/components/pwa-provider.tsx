'use client';

import { useEffect, useState } from 'react';
import { usePWAStore } from '@/lib/pwa-store';

export function PWAProvider() {
  const { setUpdateAvailable, setRemoteVersion, setTriggerUpdate, setCheckForUpdate, fetchServiceWorkerVersion } = usePWAStore();
  const [shouldRegister, setShouldRegister] = useState(false);

  useEffect(() => {
    const unsubscribe = usePWAStore.subscribe(
      (state) => {
        console.log('PWA state changed:', {
          current: state.serviceWorkerVersion,
          remote: state.remoteVersion,
          updateAvailable: state.updateAvailable,
        });
      }
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (shouldRegister && 'serviceWorker' in navigator) {
      const register = async () => {
        const registration = await registerServiceWorker();
        fetchServiceWorkerVersion();
        if (registration) {
          setCheckForUpdate(() => () => {
            registration.update().then(foundUpdate => {
              console.log(foundUpdate ? 'Update found after checking!' : 'No update found after checking.');
            });
          });
        }
      };
      register();
    }
  }, [shouldRegister, setUpdateAvailable, setRemoteVersion, setTriggerUpdate, setCheckForUpdate, fetchServiceWorkerVersion]);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New version available! Setting update flag.');
              setUpdateAvailable(true);
              setTriggerUpdate(() => () => {
                window.location.reload();
              });

              // Get version from the new worker
              const messageChannel = new MessageChannel();
              messageChannel.port1.onmessage = (event) => {
                if (event.data && event.data.type === 'VERSION_RESPONSE') {
                  console.log('远程版本:', event.data.version);
                  setRemoteVersion(event.data.version);
                }
              };
              newWorker.postMessage({ type: 'GET_VERSION' }, [messageChannel.port2]);
            }
          });
        }
      });

      navigator.serviceWorker.addEventListener('message', event => {
        console.log('Message from service worker:', event.data);
      });

      console.log('Service Worker registered successfully:', registration.scope);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  };

  return null;
}