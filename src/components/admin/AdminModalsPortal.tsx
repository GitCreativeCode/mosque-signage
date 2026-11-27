'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Check } from 'lucide-react';
import type { Settings } from '@/types/index';
import { broadcastSignageEvent } from '@/lib/events/broadcast-channel';
import { ConfirmationModal } from './common/ConfirmationModal';
import { AdminLoadingFallback } from './common/AdminLoadingFallback';
import { BetaNoticeModal, triggerBetaNoticeReset } from '../common/BetaNoticeModal';

const DynamicPosterUploadModal = dynamic(
  () => import('./posters/PosterUploadModal').then((m) => m.PosterUploadModal),
  { loading: () => <AdminLoadingFallback label="Loading upload dialog..." /> }
);

const DynamicAnnouncementSlideModal = dynamic(
  () => import('./posters/AnnouncementSlideModal').then((m) => m.AnnouncementSlideModal),
  { loading: () => <AdminLoadingFallback label="Loading notice generator..." /> }
);

const DynamicInitialSetupModal = dynamic(
  () => import('./settings/InitialSetupModal').then((m) => m.InitialSetupModal),
  { loading: () => <AdminLoadingFallback label="Loading initial setup..." /> }
);

const DynamicPwaInstallModal = dynamic(
  () => import('./settings/PwaInstallModal').then((m) => m.PwaInstallModal),
  { loading: () => <AdminLoadingFallback label="Loading app install guide..." /> }
);

export interface AdminModalsPortalProps {
  readonly settings: Settings;
  readonly quickActionNotice: string | null;
  readonly isUploadModalOpen: boolean;
  readonly isAnnouncementModalOpen: boolean;
  readonly isInitialSetupModalOpen: boolean;
  readonly showPwaModal: boolean;
  readonly showLeaveConfirmation: boolean;
  readonly onCloseUpload: () => void;
  readonly onCloseAnnouncement: () => void;
  readonly onCloseInitialSetup: () => void;
  readonly onClosePwaModal: () => void;
  readonly onRefreshPosters: () => void;
  readonly onRefreshSettings: () => void;
  readonly onConfirmLeave: () => void;
  readonly onCancelLeave: () => void;
}

export function AdminModalsPortal({
  settings,
  quickActionNotice,
  isUploadModalOpen,
  isAnnouncementModalOpen,
  isInitialSetupModalOpen,
  showPwaModal,
  showLeaveConfirmation,
  onCloseUpload,
  onCloseAnnouncement,
  onCloseInitialSetup,
  onClosePwaModal,
  onRefreshPosters,
  onRefreshSettings,
  onConfirmLeave,
  onCancelLeave,
}: AdminModalsPortalProps) {
  return (
    <>
      {quickActionNotice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:bottom-6 sm:right-6 z-50 flex items-center space-x-2.5 bg-[var(--admin-surface)] border border-[var(--admin-border)] shadow-2xl px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--admin-text-primary)] animate-fadeIn"
        >
          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{quickActionNotice}</span>
        </div>
      )}

      {isUploadModalOpen && (
        <DynamicPosterUploadModal
          isOpen={isUploadModalOpen}
          onClose={onCloseUpload}
          venueTimezone={settings.timezone}
          onUploaded={() => {
            onRefreshPosters();
            broadcastSignageEvent({ type: 'POSTERS_UPDATED', action: 'create' });
          }}
        />
      )}

      {isAnnouncementModalOpen && (
        <DynamicAnnouncementSlideModal
          isOpen={isAnnouncementModalOpen}
          onClose={onCloseAnnouncement}
          venueTimezone={settings.timezone}
          onCreated={() => {
            onRefreshPosters();
            broadcastSignageEvent({ type: 'POSTERS_UPDATED', action: 'create' });
          }}
        />
      )}

      {isInitialSetupModalOpen && (
        <DynamicInitialSetupModal
          isOpen={isInitialSetupModalOpen}
          settings={settings}
          onClose={onCloseInitialSetup}
          onComplete={() => {
            onCloseInitialSetup();
            onRefreshSettings();
            onRefreshPosters();
            broadcastSignageEvent({ type: 'SETTINGS_UPDATED' });
            broadcastSignageEvent({ type: 'POSTERS_UPDATED', action: 'refresh' });
            triggerBetaNoticeReset();
          }}
        />
      )}

      {showPwaModal && <DynamicPwaInstallModal isOpen={showPwaModal} onClose={onClosePwaModal} />}

      <BetaNoticeModal isSuspended={isInitialSetupModalOpen} />

      <ConfirmationModal
        isOpen={showLeaveConfirmation}
        title="Unsaved Changes"
        message="You have unsaved changes in this section. If you leave now, your changes will be discarded."
        confirmLabel="Discard & Leave"
        cancelLabel="Keep Editing"
        variant="warning"
        onConfirm={onConfirmLeave}
        onCancel={onCancelLeave}
      />
    </>
  );
}

