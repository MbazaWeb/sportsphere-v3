'use client';

import { useEffect } from 'react';

/**
 * Register the service worker for PWA offline support.
 *
 * IMPORTANT: Only registered in production. In development the service
 * worker caches JS chunks (network-first, but it still caches them),
 * which causes stale chunks to be served after code changes — producing
 * errors like "module factory is not available" when an icon import is
 * removed/renamed. Dev mode must always hit the network fresh.
 */
export function useServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    // Never register the service worker in development.
    if (process.env.NODE_ENV !== 'production') {
      // Actively unregister any leftover service worker from a previous
      // production build so it stops intercepting dev requests.
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((reg) => reg.unregister());
      }).catch(() => {});
      return;
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        if (process.env.NODE_ENV !== 'production') {
          console.log('SW registered:', registration.scope);
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('SW registration failed:', error);
        }
      }
    };

    // Capture the beforeinstallprompt event so the app can show an install UI later
    const handleBeforeInstall = (e: any) => {
      try {
        e.preventDefault();
      } catch {}
      // store for later (UI code can call window.__deferredPrompt.prompt())
      try { (window as any).__deferredPrompt = e; } catch {}
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall as EventListener);

    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW);
    }

    return () => {
      window.removeEventListener('load', registerSW);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall as EventListener);
    };
  }, []);
}
