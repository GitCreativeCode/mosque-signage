'use client';

import React from 'react';
import { HelpCircle, X } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface StudioShortcutsModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

const KEYBOARD_SHORTCUTS = [
  { label: 'Select Layer by Number', key: '1 - 9', isBadge: true },
  { label: 'Nudge Selected Layer (1% / 5%)', key: 'Arrow Keys / Shift+Arrows', isBadge: true },
  { label: 'Marquee Multi-Select', key: 'Drag on empty canvas', isBadge: false },
  { label: 'Duplicate Selected Layer', key: 'Ctrl + D', isBadge: true },
  { label: 'Copy / Paste Selected Layer(s)', key: 'Ctrl + C / Ctrl + V', isBadge: true },
  { label: 'Toggle Lock on Layer', key: 'Ctrl + L', isBadge: true },
  { label: 'Delete Selected Layer', key: 'Del / Backspace', isBadge: true },
  { label: 'Undo / Redo Last Action', key: 'Ctrl + Z / Ctrl + Y', isBadge: true },
  { label: 'Zoom Preview Stage', key: 'Ctrl + Scroll', isBadge: true },
  { label: 'Pan Stage Horizontally', key: 'Alt + Scroll', isBadge: true },
  { label: 'Right-Click Context Menu', key: 'Right-Click', isBadge: true },
  { label: 'Move Text or Stickers', key: 'Click & Drag on Canvas', isBadge: false },
  { label: 'Reorder Layers', key: 'Drag rows or canvas slots', isBadge: false },
  { label: 'Deselect / Close', key: 'Esc', isBadge: true },
] as const;

/** Modal dialog listing Layout Studio keyboard shortcuts and quick canvas tips. */
export function StudioShortcutsModal({ isOpen, onClose }: StudioShortcutsModalProps) {
  const modalRef = useFocusTrap({ isActive: isOpen, onEscape: onClose });
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="studio-shortcuts-title"
      className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-2xl p-6 shadow-2xl text-[var(--admin-text-primary)] space-y-4 animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--admin-border)]">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[var(--admin-tab-active-border)]" />
            <h3 id="studio-shortcuts-title" className="font-bold text-sm">Studio Shortcuts &amp; Help</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shortcuts dialog"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-surface)] cursor-pointer transition"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-2 text-xs">
          {KEYBOARD_SHORTCUTS.map((item) => (
            <div key={item.label} className="flex items-center justify-between p-2 rounded-xl bg-[var(--admin-surface)]">
              <span className="font-medium">{item.label}</span>
              {item.isBadge ? (
                <kbd className="px-2 py-0.5 rounded bg-[var(--admin-card)] border border-[var(--admin-border)] font-mono font-bold text-[11px]">
                  {item.key}
                </kbd>
              ) : (
                <span className="text-[var(--admin-text-muted)] font-medium">{item.key}</span>
              )}
            </div>
          ))}
        </div>

        <div className="pt-2 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[var(--admin-btn-primary-bg)] hover:bg-[var(--admin-btn-primary-hover)] text-[var(--admin-btn-primary-text)] font-semibold text-xs cursor-pointer shadow-sm"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

