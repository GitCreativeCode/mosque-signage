'use client';

import React from 'react';
import { Check } from 'lucide-react';
import type { Settings } from '@/types/index';
import { broadcastSignageEvent } from '@/lib/events/broadcast-channel';
import { PosterUploadModal } from './posters/PosterUploadModal';
import { AnnouncementSlideModal } from './posters/AnnouncementSlideModal';
import { InitialSetupModal } from './settings/InitialSetupModal';
import { PwaInstallModal } from './settings/PwaInstallModal';
import { ConfirmationModal } from './common/ConfirmationModal';
import { BetaNoticeModal, triggerBetaNoticeReset } from '../common/BetaNoticeModal';

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
          className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 bg-[var(--admin-surface)] border border-[var(--admin-border)] shadow-2xl px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--admin-text-primary)] animate-fadeIn"
        >
          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{quickActionNotice}</span>
        </div>
      )}

      <PosterUploadModal
        isOpen={isUploadModalOpen}
        onClose={onCloseUpload}
        venueTimezone={settings.timezone}
        onUploaded={() => {
          onRefreshPosters();
          broadcastSignageEvent({ type: 'POSTERS_UPDATED', action: 'create' });
        }}
      />

      <AnnouncementSlideModal
        isOpen={isAnnouncementModalOpen}
        onClose={onCloseAnnouncement}
        venueTimezone={settings.timezone}
        onCreated={() => {
          onRefreshPosters();
          broadcastSignageEvent({ type: 'POSTERS_UPDATED', action: 'create' });
        }}
      />

      {isInitialSetupModalOpen && (
        <InitialSetupModal
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

      <PwaInstallModal isOpen={showPwaModal} onClose={onClosePwaModal} />

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

