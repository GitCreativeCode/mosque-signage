'use client';

import React from 'react';
import type { LayerItemTarget, SelectedEntity } from '@/lib/posters/studio-types';
import type { SlotFitMode } from '@/types/index';
import type { LayerAlignment } from '@/lib/posters/studio-bounds';
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndVertical,
  AlignLeft,
  AlignRight,
  AlignStartVertical,
  AlignCenter,
  ChevronDown,
  ChevronUp,
  ChevronsDown,
  ChevronsUp,
  Copy,
  FileText,
  FlipHorizontal,
  FlipVertical,
  FolderPlus,
  Lock,
  Maximize2,
  RotateCcw,
  Sparkles,
  Trash2,
  Type,
  Ungroup,
  Unlock,
  Upload,
  XCircle,
} from 'lucide-react';

export interface ContextMenuTarget {
  readonly mode: 'layer' | 'multi' | 'canvas';
  readonly position: { x: number; y: number };
  readonly entity?: SelectedEntity | null;
  readonly itemTarget?: LayerItemTarget | null;
  readonly isLocked?: boolean;
  readonly supportsFlip?: boolean;
  readonly slotFitMode?: SlotFitMode;
}

interface StudioCanvasContextMenuProps {
  readonly menu: ContextMenuTarget | null;
  readonly selectedCount: number;
  readonly onClose: () => void;
  readonly onGroupSelected: () => void;
  readonly onMergeSelected?: (() => void) | undefined;
  readonly onDuplicateSelected?: (() => void) | undefined;
  readonly onAlignSelected?: ((alignment: LayerAlignment) => void) | undefined;
  readonly onBatchBringToFront?: (() => void) | undefined;
  readonly onBatchSendToBack?: (() => void) | undefined;
  readonly onBatchFlipHorizontal?: (() => void) | undefined;
  readonly onBatchFlipVertical?: (() => void) | undefined;
  readonly onToggleLockSelected: () => void;
  readonly onDeleteSelected: () => void;
  readonly onBringToFront: (t: LayerItemTarget) => void;
  readonly onBringForward: (t: LayerItemTarget) => void;
  readonly onSendBackward: (t: LayerItemTarget) => void;
  readonly onSendToBack: (t: LayerItemTarget) => void;
  readonly onDuplicate: (t: LayerItemTarget) => void;
  readonly onToggleLock: (t: LayerItemTarget) => void;
  readonly onCenterEntity: (entity: SelectedEntity) => void;
  readonly onToggleFitMode?: ((entity: SelectedEntity) => void) | undefined;
  readonly onFlipHorizontal?: ((entity: SelectedEntity) => void) | undefined;
  readonly onFlipVertical?: ((entity: SelectedEntity) => void) | undefined;
  readonly onDeleteLayer: (t: LayerItemTarget) => void;
  readonly onPickUploadFiles: () => void;
  readonly onAddNotice: () => void;
  readonly onAddTextBanner: () => void;
  readonly onOpenStickersTab: () => void;
  readonly onResetViewport: () => void;
  readonly onDeselectAll: () => void;
}

function MenuItem({
  icon: Icon,
  label,
  shortcut,
  variant = 'default',
  onClick,
}: {
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly label: string;
  readonly shortcut?: string;
  readonly variant?: 'default' | 'danger' | 'accent';
  readonly onClick: () => void;
}) {
  const textColor =
    variant === 'danger'
      ? 'text-rose-400 hover:bg-rose-950/40'
      : variant === 'accent'
      ? 'text-amber-400 hover:bg-amber-950/30'
      : 'text-[var(--admin-text-primary)] hover:bg-[var(--admin-surface)]';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition cursor-pointer select-none ${textColor}`}
    >
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span>{label}</span>
      </div>
      {shortcut && <span className="font-mono text-[10px] text-[var(--admin-text-muted)]">{shortcut}</span>}
    </button>
  );
}

/** Comprehensive right-click contextual action menu for the 16:9 stage preview canvas. */
export function StudioCanvasContextMenu(props: StudioCanvasContextMenuProps) {
  const { menu, onClose } = props;
  if (!menu) return null;

  const posX = typeof window !== 'undefined' ? Math.min(window.innerWidth - 220, Math.max(10, menu.position.x)) : menu.position.x;
  const posY = typeof window !== 'undefined' ? Math.min(window.innerHeight - 380, Math.max(10, menu.position.y)) : menu.position.y;

  return (
    <div
      data-context-menu="true"
      style={{ position: 'fixed', left: posX, top: posY, zIndex: 99999 }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className="w-52 bg-[var(--admin-card)]/95 border border-[var(--admin-border)] rounded-2xl shadow-2xl p-1.5 text-xs text-[var(--admin-text-primary)] animate-in fade-in zoom-in-95 duration-100 backdrop-blur-xl"
    >
      {menu.mode === 'multi' && (
        <div className="space-y-0.5">
          <div className="px-2.5 py-1 text-[10px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wider">
            {props.selectedCount} Layers Selected
          </div>
          <MenuItem icon={FolderPlus} label="Group into Folder" onClick={() => { props.onGroupSelected(); onClose(); }} />
          {props.onMergeSelected && (
            <MenuItem icon={Ungroup} label="Merge into Single Layer" onClick={() => { props.onMergeSelected!(); onClose(); }} />
          )}
          {props.onDuplicateSelected && (
            <MenuItem icon={Copy} label="Duplicate Selected" shortcut="Ctrl+D" onClick={() => { props.onDuplicateSelected!(); onClose(); }} />
          )}
          <div className="w-full h-[1px] bg-[var(--admin-border)] my-1" />
          {props.onBatchBringToFront && (
            <MenuItem icon={ChevronsUp} label="Bring to Front" onClick={() => { props.onBatchBringToFront!(); onClose(); }} />
          )}
          {props.onBatchSendToBack && (
            <MenuItem icon={ChevronsDown} label="Send to Back" onClick={() => { props.onBatchSendToBack!(); onClose(); }} />
          )}
          {props.onBatchFlipHorizontal && (
            <MenuItem icon={FlipHorizontal} label="Flip Horizontal" onClick={() => { props.onBatchFlipHorizontal!(); onClose(); }} />
          )}
          {props.onBatchFlipVertical && (
            <MenuItem icon={FlipVertical} label="Flip Vertical" onClick={() => { props.onBatchFlipVertical!(); onClose(); }} />
          )}
          <div className="w-full h-[1px] bg-[var(--admin-border)] my-1" />
          <div className="grid grid-cols-6 gap-0.5 px-1 py-0.5">
            {[
              { a: 'left' as const, I: AlignLeft, t: 'Left' },
              { a: 'center' as const, I: AlignCenterHorizontal, t: 'Center H' },
              { a: 'right' as const, I: AlignRight, t: 'Right' },
              { a: 'top' as const, I: AlignStartVertical, t: 'Top' },
              { a: 'middle' as const, I: AlignCenterVertical, t: 'Middle V' },
              { a: 'bottom' as const, I: AlignEndVertical, t: 'Bottom' },
            ].map(({ a, I, t }) => (
              <button key={a} type="button" onClick={() => { props.onAlignSelected?.(a); onClose(); }} title={t} className="p-1 rounded flex items-center justify-center hover:bg-[var(--admin-surface)] text-[var(--admin-text-primary)] cursor-pointer">
                <I className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
          <div className="w-full h-[1px] bg-[var(--admin-border)] my-1" />
          <MenuItem icon={Lock} label="Lock / Unlock All" shortcut="Ctrl+L" onClick={() => { props.onToggleLockSelected(); onClose(); }} />
          <MenuItem icon={XCircle} label="Deselect All" shortcut="Esc" onClick={() => { props.onDeselectAll(); onClose(); }} />
          <div className="w-full h-[1px] bg-[var(--admin-border)] my-1" />
          <MenuItem icon={Trash2} label="Delete Selected" shortcut="Del" variant="danger" onClick={() => { props.onDeleteSelected(); onClose(); }} />
        </div>
      )}

      {menu.mode === 'layer' && menu.itemTarget && menu.entity && (
        <div className="space-y-0.5">
          <div className="px-2.5 py-1 text-[10px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wider">
            Layer Actions
          </div>
          <MenuItem icon={ChevronsUp} label="Bring to Front" onClick={() => { props.onBringToFront(menu.itemTarget!); onClose(); }} />
          <MenuItem icon={ChevronUp} label="Bring Forward" onClick={() => { props.onBringForward(menu.itemTarget!); onClose(); }} />
          <MenuItem icon={ChevronDown} label="Send Backward" onClick={() => { props.onSendBackward(menu.itemTarget!); onClose(); }} />
          <MenuItem icon={ChevronsDown} label="Send to Back" onClick={() => { props.onSendToBack(menu.itemTarget!); onClose(); }} />
          <div className="w-full h-[1px] bg-[var(--admin-border)] my-1" />
          <MenuItem icon={AlignCenter} label="Center on Canvas" onClick={() => { props.onCenterEntity(menu.entity!); onClose(); }} />
          {menu.slotFitMode && props.onToggleFitMode && (
            <MenuItem icon={Maximize2} label={`Fit: ${menu.slotFitMode}`} onClick={() => { props.onToggleFitMode!(menu.entity!); onClose(); }} />
          )}
          {menu.supportsFlip && (
            <>
              {props.onFlipHorizontal && <MenuItem icon={FlipHorizontal} label="Flip Horizontal" onClick={() => { props.onFlipHorizontal!(menu.entity!); onClose(); }} />}
              {props.onFlipVertical && <MenuItem icon={FlipVertical} label="Flip Vertical" onClick={() => { props.onFlipVertical!(menu.entity!); onClose(); }} />}
            </>
          )}
          <MenuItem icon={Copy} label="Duplicate" shortcut="Ctrl+D" onClick={() => { props.onDuplicate(menu.itemTarget!); onClose(); }} />
          <MenuItem icon={menu.isLocked ? Unlock : Lock} label={menu.isLocked ? 'Unlock Layer' : 'Lock Layer'} shortcut="Ctrl+L" onClick={() => { props.onToggleLock(menu.itemTarget!); onClose(); }} />
          <div className="w-full h-[1px] bg-[var(--admin-border)] my-1" />
          <MenuItem icon={Trash2} label="Delete Layer" shortcut="Del" variant="danger" onClick={() => { props.onDeleteLayer(menu.itemTarget!); onClose(); }} />
        </div>
      )}

      {menu.mode === 'canvas' && (
        <div className="space-y-0.5">
          <div className="px-2.5 py-1 text-[10px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wider">
            Add to Canvas
          </div>
          <MenuItem icon={Upload} label="Add Images / Videos" onClick={() => { props.onPickUploadFiles(); onClose(); }} />
          <MenuItem icon={FileText} label="Add Notice Card" onClick={() => { props.onAddNotice(); onClose(); }} />
          <MenuItem icon={Type} label="Add Text Banner" onClick={() => { props.onAddTextBanner(); onClose(); }} />
          <MenuItem icon={Sparkles} label="Add Sacred Sticker" onClick={() => { props.onOpenStickersTab(); onClose(); }} />
          <div className="w-full h-[1px] bg-[var(--admin-border)] my-1" />
          <MenuItem icon={RotateCcw} label="Reset View (100%)" onClick={() => { props.onResetViewport(); onClose(); }} />
          {props.selectedCount > 0 && (
            <MenuItem icon={XCircle} label="Deselect All" shortcut="Esc" onClick={() => { props.onDeselectAll(); onClose(); }} />
          )}
        </div>
      )}
    </div>
  );
}
