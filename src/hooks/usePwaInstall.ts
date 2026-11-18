'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collectPwaDiagnostics,
  DEFAULT_PWA_DIAGNOSTICS,
  type PwaDiagnostics,
} from '@/lib/system/pwa-diagnostics';

export type { PwaDiagnostics };

export interface PwaInstallState {
  readonly isInstallable: boolean;
  readonly isInstalled: boolean;
  readonly isStandalone: boolean;
  readonly diagnostics: PwaDiagnostics;
  readonly triggerInstall: () => Promise<'accepted' | 'dismissed' | 'manual_guide'>;
  readonly refreshDiagnostics: () => Promise<void>;
}

export function usePwaInstall(): PwaInstallState {
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [diagnostics, setDiagnostics] = useState<PwaDiagnostics>(DEFAULT_PWA_DIAGNOSTICS);

  const evaluateDiagnostics = useCallback(async () => {
    const diag = await collectPwaDiagnostics();
    setDiagnostics(diag);
    setIsStandalone(diag.isStandalone);
    setIsInstalled(diag.isStandalone || diag.isInstalledOnDevice);
    setIsInstallable(diag.promptCaptured && !diag.isStandalone);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    evaluateDiagnostics();

    const refresh = () => { evaluateDiagnostics(); };
    const onPrompt = (e: Event) => {
      e.preventDefault();
      window.__deferredPrompt = e as BeforeInstallPromptEvent;
      window.deferredPwaPrompt = e as BeforeInstallPromptEvent;
      evaluateDiagnostics();
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('pwa-prompt-ready', refresh);
    window.addEventListener('pwa:install-available', refresh);
    window.addEventListener('pwa:installed', refresh);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', refresh);
      navigator.serviceWorker.ready.then(refresh).catch(() => {});
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('pwa-prompt-ready', refresh);
      window.removeEventListener('pwa:install-available', refresh);
      window.removeEventListener('pwa:installed', refresh);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('controllerchange', refresh);
      }
    };
  }, [evaluateDiagnostics]);

  const triggerInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'manual_guide'> => {
    if (typeof window === 'undefined') return 'manual_guide';
    const promptEvent = window.__deferredPrompt || window.deferredPwaPrompt;
    if (!promptEvent || typeof promptEvent.prompt !== 'function') return 'manual_guide';

    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome !== 'accepted') return 'dismissed';
      window.__deferredPrompt = null;
      window.deferredPwaPrompt = null;
      setIsInstallable(false);
      setIsInstalled(true);
      return 'accepted';
    } catch {
      return 'manual_guide';
    }
  }, []);

  return { isInstallable, isInstalled, isStandalone, diagnostics, triggerInstall, refreshDiagnostics: evaluateDiagnostics };
}
