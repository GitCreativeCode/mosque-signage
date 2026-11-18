/**
 * Browser PWA Capability & Diagnostics Collector
 * MosqueSignage (TV)
 */

export interface PwaDiagnostics {
  readonly isSecureContext: boolean;
  readonly protocol: string;
  readonly host: string;
  readonly hasServiceWorkerSupport: boolean;
  readonly isServiceWorkerControlling: boolean;
  readonly hasManifestLink: boolean;
  readonly isStandalone: boolean;
  readonly promptCaptured: boolean;
  readonly isInstalledOnDevice: boolean;
  readonly installFailureReason: string | null;
}

export const DEFAULT_PWA_DIAGNOSTICS: PwaDiagnostics = {
  isSecureContext: false,
  protocol: '',
  host: '',
  hasServiceWorkerSupport: false,
  isServiceWorkerControlling: false,
  hasManifestLink: false,
  isStandalone: false,
  promptCaptured: false,
  isInstalledOnDevice: false,
  installFailureReason: null,
};

function resolveFailureReason(
  isSecure: boolean,
  protocol: string,
  host: string,
  isStandalone: boolean,
  isInstalledOnDevice: boolean,
  swControlling: boolean,
  hasSw: boolean,
  promptCaptured: boolean
): string | null {
  if (!isSecure) {
    return `Insecure Origin (${protocol}//${host}): Browsers require http://localhost or https:// for PWA installation.`;
  }
  if (isStandalone || isInstalledOnDevice) {
    return 'Application is already installed on this device (visit edge://apps or chrome://apps). Address bar download icon is suppressed by the browser.';
  }
  if (!swControlling && hasSw) {
    return 'Service Worker was just registered and is activating. Reload the page (F5 or click below) so the browser loads under the active Service Worker.';
  }
  if (!promptCaptured) {
    return 'Browser has not dispatched the install prompt event. (On desktop, Edge/Chrome requires page interaction or reload before firing beforeinstallprompt. Use Edge menu "..." -> More tools -> Apps -> Install this site as an app).';
  }
  return null;
}

export async function collectPwaDiagnostics(): Promise<PwaDiagnostics> {
  if (typeof window === 'undefined') return DEFAULT_PWA_DIAGNOSTICS;

  const isSecureContext = window.isSecureContext ?? false;
  const { protocol, host } = window.location;
  const hasServiceWorkerSupport = 'serviceWorker' in navigator;
  const isServiceWorkerControlling = Boolean(navigator.serviceWorker?.controller);
  const hasManifestLink = Boolean(document.querySelector('link[rel="manifest"]'));
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  const promptCaptured = Boolean(window.__deferredPrompt || window.deferredPwaPrompt);

  let isInstalledOnDevice = isStandalone;
  if ('getInstalledRelatedApps' in navigator) {
    try {
      const apps = await (navigator as unknown as { getInstalledRelatedApps: () => Promise<unknown[]> }).getInstalledRelatedApps();
      if (apps.length > 0) isInstalledOnDevice = true;
    } catch {
      // Ignored in non-supporting browsers
    }
  }

  return {
    isSecureContext,
    protocol,
    host,
    hasServiceWorkerSupport,
    isServiceWorkerControlling,
    hasManifestLink,
    isStandalone,
    promptCaptured,
    isInstalledOnDevice,
    installFailureReason: resolveFailureReason(
      isSecureContext,
      protocol,
      host,
      isStandalone,
      isInstalledOnDevice,
      isServiceWorkerControlling,
      hasServiceWorkerSupport,
      promptCaptured
    ),
  };
}

