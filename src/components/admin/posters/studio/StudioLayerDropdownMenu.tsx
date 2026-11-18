'use client';

import React from 'react';
import { ChevronDown, ChevronUp, Copy, Edit3, Lock, Trash2, Ungroup, Unlock } from 'lucide-react';

interface StudioLayerDropdownMenuProps {
  readonly isLocked: boolean;
  readonly lockLabel: string;
  readonly isFolder?: boolean | undefined;
  readonly onRename: () => void;
  readonly onMoveUp: () => void;
  readonly onMoveDown: () => void;
  readonly onToggleLock: () => void;
  readonly onDuplicate: () => void;
  readonly onUngroup?: (() => void) | undefined;
  readonly onDelete: () => void;
  readonly onClose: () => void;
}

/** Floating 3-dots action dropdown shared by individual layer rows and layer folders. */
export function StudioLayerDropdownMenu({
  isLocked,
  lockLabel,
  isFolder = false,
  onRename,
  onMoveUp,
  onMoveDown,
  onToggleLock,
  onDuplicate,
  onUngroup,
  onDelete,
  onClose,
}: StudioLayerDropdownMenuProps) {
  const runAndClose = (fn: () => void) => () => {
    fn();
    onClose();
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`absolute right-0 top-full mt-1 ${isFolder ? 'w-44' : 'w-40'} bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-xl shadow-2xl z-50 py-1 text-xs text-[var(--admin-text-primary)] animate-in fade-in zoom-in-95 duration-100 backdrop-blur-md`}
    >
      <button type="button" onClick={runAndClose(onRename)} className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-[var(--admin-surface)] cursor-pointer">
        <Edit3 className="w-3.5 h-3.5" />
        <span>Rename</span>
      </button>

      <button
        type="button"
        disabled={isLocked}
        onClick={runAndClose(onMoveUp)}
        className={`w-full flex items-center gap-2 px-3 py-1.5 text-left ${
          isLocked ? 'opacity-30 cursor-not-allowed text-[var(--admin-text-muted)]' : 'hover:bg-[var(--admin-surface)] cursor-pointer'
        }`}
      >
        <ChevronUp className="w-3.5 h-3.5" />
        <span>Bring Forward</span>
      </button>

      <button
        type="button"
        disabled={isLocked}
        onClick={runAndClose(onMoveDown)}
        className={`w-full flex items-center gap-2 px-3 py-1.5 text-left ${
          isLocked ? 'opacity-30 cursor-not-allowed text-[var(--admin-text-muted)]' : 'hover:bg-[var(--admin-surface)] cursor-pointer'
        }`}
      >
        <ChevronDown className="w-3.5 h-3.5" />
        <span>Send Backward</span>
      </button>

      <button type="button" onClick={runAndClose(onToggleLock)} className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-[var(--admin-surface)] cursor-pointer">
        {isLocked ? <Unlock className="w-3.5 h-3.5 text-amber-400" /> : <Lock className="w-3.5 h-3.5" />}
        <span>{lockLabel}</span>
      </button>

      <button type="button" onClick={runAndClose(onDuplicate)} className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-[var(--admin-surface)] cursor-pointer">
        <Copy className="w-3.5 h-3.5" />
        <span>{isFolder ? 'Duplicate Folder' : 'Duplicate'}</span>
      </button>

      <div className="w-full h-[1px] bg-[var(--admin-border)] my-1" />

      {onUngroup && (
        <button type="button" onClick={runAndClose(onUngroup)} className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-[var(--admin-surface)] cursor-pointer">
          <Ungroup className="w-3.5 h-3.5" />
          <span>Ungroup Items</span>
        </button>
      )}

      <button type="button" onClick={runAndClose(onDelete)} className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-rose-400 hover:bg-rose-950/40 cursor-pointer">
        <Trash2 className="w-3.5 h-3.5" />
        <span>{isFolder ? 'Delete Folder & Contents' : 'Delete'}</span>
      </button>
    </div>
  );
}

