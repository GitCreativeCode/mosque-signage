'use client';

import React from 'react';
import type { StudioHistorySnapshot } from '@/lib/posters/studio-types';
import { History, Check, X, Undo2, Redo2 } from 'lucide-react';

interface StudioHistoryFlyoutProps {
  readonly isOpen: boolean;
  readonly history: readonly StudioHistorySnapshot[];
  readonly historyIndex: number;
  readonly onClose: () => void;
  readonly onJumpTo: (index: number) => void;
}

/** Photoshop-style floating history panel displaying chronological actions with click-to-revert. */
export function StudioHistoryFlyout({
  isOpen,
  history,
  historyIndex,
  onClose,
  onJumpTo,
}: StudioHistoryFlyoutProps) {
  if (!isOpen) return null;

  return (
    <div
      data-history-flyout="true"
      onClick={(e) => e.stopPropagation()}
      className="absolute top-full right-12 mt-2 w-72 bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-2xl shadow-2xl p-2.5 text-xs text-[var(--admin-text-primary)] z-[80] animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-[var(--admin-border)] mb-1.5">
        <div className="flex items-center gap-1.5 font-bold text-xs">
          <History className="w-3.5 h-3.5 text-amber-400" />
          <span>History States</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[var(--admin-surface)] text-[var(--admin-text-secondary)] border border-[var(--admin-border)]">
            {historyIndex + 1}/{history.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-surface)] transition-colors cursor-pointer"
          aria-label="Close history panel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="max-h-64 overflow-y-auto space-y-1 overscroll-contain pr-1">
        {history.map((snapshot, idx) => {
          const isCurrent = idx === historyIndex;
          const isFuture = idx > historyIndex;
          const label = snapshot.actionLabel || (idx === 0 ? 'Initial State' : `Step #${idx + 1}`);

          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onJumpTo(idx);
                onClose();
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs transition cursor-pointer ${
                isCurrent
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-400/50 shadow-xs'
                  : isFuture
                  ? 'text-[var(--admin-text-muted)] opacity-50 hover:opacity-80 hover:bg-[var(--admin-surface)]'
                  : 'text-[var(--admin-text-primary)] hover:bg-[var(--admin-surface)]'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-[10px] text-[var(--admin-text-muted)] w-4 text-right shrink-0">
                  #{idx + 1}
                </span>
                <span className="truncate">{label}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {isCurrent && <Check className="w-3.5 h-3.5 text-amber-400" />}
                {isFuture && <Redo2 className="w-3 h-3 text-[var(--admin-text-muted)]" />}
                {!isCurrent && !isFuture && <Undo2 className="w-3 h-3 opacity-40" />}
              </div>
            </button>
          );
        })}
      </div>

      {historyIndex < history.length - 1 && (
        <p className="text-[10px] text-amber-400/80 italic text-center pt-1.5 border-t border-[var(--admin-border)] mt-1.5">
          New actions will overwrite future states
        </p>
      )}
    </div>
  );
}

