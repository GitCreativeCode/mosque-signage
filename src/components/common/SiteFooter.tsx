'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { APP_VERSION, type ReleaseInfo } from '@/lib/system/version';
import { ApplianceUpdateModal } from './ApplianceUpdateModal';
import { WhatsNewModal } from './WhatsNewModal';

export { APP_VERSION };

export interface SiteFooterProps {
  readonly className?: string | undefined;
  readonly version?: string | undefined;
}

/**
 * Interactive version pill that checks for updates in the background.
 */
function FooterVersionBadge({ version = APP_VERSION }: { readonly version?: string | undefined }) {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [latestVersion, setLatestVersion] = useState(version);
  const [releaseInfo, setReleaseInfo] = useState<ReleaseInfo | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkVersion() {
      try {
        const res = await fetch('/api/system/version', { cache: 'no-cache' });
        if (!res.ok) return;
        const data = (await res.json()) as {
          hasUpdate?: boolean;
          latestVersion?: string;
          release?: ReleaseInfo | null;
        };

        if (isMounted && data.hasUpdate && data.latestVersion) {
          setHasUpdate(true);
          setLatestVersion(data.latestVersion);
          setReleaseInfo(data.release || null);
        }
      } catch {
        // Silent failure in offline kiosk mode
      }
    }

    checkVersion();

    // Active polling every 2 minutes while tab is open
    const pollInterval = setInterval(checkVersion, 2 * 60 * 1000);

    // Re-check immediately whenever user refocuses tab or returns to window
    const handleFocus = () => {
      checkVersion();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <>
      {hasUpdate ? (
        <button
          type="button"
          onClick={() => setIsUpdateModalOpen(true)}
          className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-green-600/15 text-green-700 dark:text-green-400 border border-green-600/30 hover:bg-green-600/25 transition cursor-pointer shadow-sm animate-pulse"
          title={`New update v${latestVersion} available! Click to inspect.`}
        >
          <Bell className="w-3 h-3" aria-hidden="true" />
          <span>v{version} &bull; Update Available (v{latestVersion})</span>
        </button>
      ) : (
        <Link
          href="/releases"
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[var(--admin-card)] text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] border border-[var(--admin-border)] hover:border-[var(--admin-text-muted)] transition shadow-xs cursor-pointer"
          title={`MosqueSignage Version ${version} - Click to view changelog`}
        >
          v{version}
        </Link>
      )}

      {/* Appliance Update Modal */}
      <ApplianceUpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        currentVersion={version}
        targetVersion={latestVersion}
        releaseInfo={releaseInfo}
      />

      {/* Post-Update "What's New" Popup */}
      <WhatsNewModal />
    </>
  );
}

/**
 * Global Site Footer
 * Displays system copyright, software version badge, update indicator, and navigation links.
 */
export function SiteFooter({ className = '', version = APP_VERSION }: SiteFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      className={`border-t border-[var(--admin-border)] bg-[var(--admin-surface)] px-6 py-5 text-xs text-[var(--admin-text-muted)] transition-colors ${className}`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Copyright & Version / Update Pill */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
          <p className="font-medium text-[var(--admin-text-secondary)]">
            &copy; {currentYear} MosqueSignage. All rights reserved.
          </p>

          <FooterVersionBadge version={version} />
        </div>

        {/* Right: Policy & Documentation Links */}
        <nav aria-label="Legal and Documentation Links" className="flex items-center space-x-5 text-xs">
          <Link
            href="/faq"
            className="hover:text-[var(--admin-text-primary)] transition cursor-pointer"
          >
            FAQ
          </Link>

          <Link
            href="/releases"
            className="hover:text-[var(--admin-text-primary)] transition cursor-pointer"
          >
            Releases
          </Link>

          <Link
            href="/privacy#contact"
            className="hover:text-[var(--admin-text-primary)] transition cursor-pointer"
          >
            Support
          </Link>

          <a
            href="https://forms.gle/E7TBvvD6H8njMhn88"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--admin-text-primary)] transition cursor-pointer"
          >
            Feedback
          </a>

          <Link
            href="/privacy"
            className="hover:text-[var(--admin-text-primary)] transition cursor-pointer"
          >
            Privacy Policy
          </Link>

          <Link
            href="/terms"
            className="hover:text-[var(--admin-text-primary)] transition cursor-pointer"
          >
            Terms of Use
          </Link>
        </nav>
      </div>
    </footer>
  );
}
