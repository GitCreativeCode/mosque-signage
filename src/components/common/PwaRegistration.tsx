'use client';

import { useEffect } from 'react';

declare global {
  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
      outcome: 'accepted' | 'dismissed';
      platform: string;
    }>;
    prompt(): Promise<void>;
  }

  interface Window {
    __deferredPrompt?: BeforeInstallPromptEvent | null;
    deferredPwaPrompt?: BeforeInstallPromptEvent | null;
  }
}

/**
 * PWA Service Worker & Install Prompt Coordinator
 * Registers /sw.js for background caching and captures the beforeinstallprompt event
 * so the Admin Dashboard can trigger the native PWA install workflow on demand.
 * Also prints comprehensive diagnostics to the browser console for debugging.
 */
export function PwaRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isSecure = window.isSecureContext;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    // Diagnostic console group
    console.groupCollapsed(
      '%c[PWA Diagnostics] Initializing Service Worker & Install Prompt Coordinator',
      'color: #38bdf8; font-weight: bold;'
    );
    console.log('Location:', window.location.href);
    console.log('Origin:', window.location.origin);
    console.log('isSecureContext:', isSecure);
    console.log('Display Mode (Standalone):', isStandalone);
    console.log('ServiceWorker API Supported:', 'serviceWorker' in navigator);
    console.log(
      'ServiceWorker Controller:',
      navigator.serviceWorker?.controller ? 'Active (controlling page)' : 'None yet (first visit or uninstalled)'
    );
    console.log(
      'Manifest Link Present:',
      Boolean(document.querySelector('link[rel="manifest"]'))
    );
    console.log(
      'Cached beforeinstallprompt:',
      Boolean(window.deferredPwaPrompt)
    );

    // Check if the browser reports the app as already installed
    if ('getInstalledRelatedApps' in navigator) {
      (navigator as unknown as { getInstalledRelatedApps: () => Promise<unknown[]> })
        .getInstalledRelatedApps()
        .then((apps) => {
          console.log('[PWA Diagnostics] Installed Related Apps detected:', apps.length, apps);
          if (apps.length > 0) {
            console.log(
              '%c[PWA Diagnostics] ℹ️ MosqueSignage is ALREADY INSTALLED on this device. Edge/Chrome will hide the address bar install icon.',
              'color: #22c55e;'
            );
          }
        })
        .catch(() => {});
    }

    console.groupEnd();

    // 1. Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log(
            '%c[PWA Diagnostics] ServiceWorker registered with scope:',
            'color: #22c55e;',
            reg.scope
          );
          reg.update().catch(() => {});
        })
        .catch((err) => {
          console.warn('[PWA Diagnostics] ServiceWorker registration failed:', err);
        });
    }

    // 2. Intercept beforeinstallprompt for manual trigger in Admin
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      window.__deferredPrompt = e as BeforeInstallPromptEvent;
      window.deferredPwaPrompt = e as BeforeInstallPromptEvent;
      console.log(
        '%c[PWA Diagnostics] 🟢 beforeinstallprompt event captured & ready to trigger!',
        'color: #22c55e; font-weight: bold;',
        e
      );
      window.dispatchEvent(new Event('pwa-prompt-ready'));
      window.dispatchEvent(new CustomEvent('pwa:install-available'));
    };

    const handleAppInstalled = () => {
      window.__deferredPrompt = null;
      window.deferredPwaPrompt = null;
      console.log(
        '%c[PWA Diagnostics] 🎉 appinstalled event fired: MosqueSignage is now installed as a desktop application!',
        'color: #22c55e; font-weight: bold;'
      );
      window.dispatchEvent(new CustomEvent('pwa:installed'));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Advisory timer: after 4 seconds, if beforeinstallprompt didn't fire and not standalone, print helpful reasons
    const advisoryTimer = setTimeout(() => {
      if (!window.deferredPwaPrompt && !isStandalone) {
        console.groupCollapsed(
          '%c[PWA Diagnostics] ℹ️ Note: beforeinstallprompt has not fired yet',
          'color: #f59e0b; font-weight: bold;'
        );
        console.log('Possible reasons why the address bar icon or prompt hasn\'t appeared:');
        console.log('1. Site Already Installed: Edge/Chrome hides the install icon and prompt once MosqueSignage is installed (visit edge://apps or chrome://apps to verify).');
        console.log('2. InPrivate / Incognito: Browsers disallow PWA installation in private browsing tabs.');
        console.log('3. Plain HTTP IP: Accessing via a LAN IP like http://192.168.x.x:3000 disables Service Workers unless on localhost or HTTPS.');
        console.log('4. Engagement heuristic: Chromium browsers sometimes require user interaction before offering the install prompt.');
        console.log('Manual Install: You can still install anytime via Microsoft Edge: "..." -> More tools -> Apps -> Install this site as an app');
        console.groupEnd();
      }
    }, 4000);

    return () => {
      clearTimeout(advisoryTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  return null;
}
