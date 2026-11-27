'use client';

import React from 'react';
import type { PosterWithStatus } from '@/types/index';
import {
  QrCode,
  ExternalLink,
  Image as ImageIcon,
  Video,
  FileText,
} from 'lucide-react';
import type { getPosterTypeInfo } from '@/lib/posters/poster-type-info';
import { sanitizeExternalUrl } from '@/lib/utils/url-safety';
import { formatIsoDateTime } from '@/lib/utils/time';
import type { getQrScheduleStatus } from '@/lib/posters/qr-schedule';

export interface PosterGridCardMetaProps {
  readonly poster: PosterWithStatus;
  readonly typeInfo: ReturnType<typeof getPosterTypeInfo>;
  readonly qrStatus: ReturnType<typeof getQrScheduleStatus> | null;
}

/** Displays schedule dates, media type, and QR metadata badges for a poster card. */
export function PosterGridCardMeta({ poster, typeInfo, qrStatus }: PosterGridCardMetaProps) {
  const safeQrHref = poster.qr_url ? sanitizeExternalUrl(poster.qr_url) : null;
  const badgeCls =
    qrStatus?.color === 'emerald'
      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      : qrStatus?.color === 'blue'
      ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      : qrStatus?.color === 'amber'
      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      : 'bg-slate-500/10 text-slate-400 border-slate-500/20';

  return (
    <div className="mt-2.5 space-y-1 text-xs text-[var(--admin-text-secondary)]">
      <div className="flex items-center space-x-1.5">
        <span className="text-[var(--admin-text-muted)] font-medium">Start:</span>
        <span className="tabular-nums font-mono">{formatIsoDateTime(poster.start_at)}</span>
      </div>
      <div className="flex items-center space-x-1.5">
        <span className="text-[var(--admin-text-muted)] font-medium">End:</span>
        <span className="tabular-nums font-mono">
          {poster.end_at ? (
            formatIsoDateTime(poster.end_at)
          ) : (
            <span className="text-emerald-500 font-medium">Indefinite</span>
          )}
        </span>
      </div>
      <div className="flex items-center space-x-1.5">
        <span className="text-[var(--admin-text-muted)] font-medium">Type:</span>
        <span className="font-medium text-[var(--admin-text-primary)] inline-flex items-center space-x-1.5">
          {typeInfo.type === 'video' ? (
            <Video className="w-3.5 h-3.5 text-[var(--admin-text-muted)] shrink-0" aria-hidden="true" />
          ) : typeInfo.type === 'notice' ? (
            <FileText className="w-3.5 h-3.5 text-[var(--admin-text-muted)] shrink-0" aria-hidden="true" />
          ) : (
            <ImageIcon className="w-3.5 h-3.5 text-[var(--admin-text-muted)] shrink-0" aria-hidden="true" />
          )}
          <span>{typeInfo.label}</span>
        </span>
      </div>
      {poster.qr_url && (
        <div className="flex items-center space-x-1.5 text-[var(--admin-text-primary)] truncate pt-1">
          <QrCode className="w-3.5 h-3.5 shrink-0 text-[var(--admin-text-muted)]" />
          <span className="truncate">{poster.qr_label ?? 'Attached Link'}</span>
          {qrStatus && qrStatus.status !== 'ALWAYS_ACTIVE' && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold border ${badgeCls}`}>
              {qrStatus.shortBadge}
            </span>
          )}
          {safeQrHref && (
            <a
              href={safeQrHref}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

