'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { CanvasBackgroundPreset, LayoutGridGap, PosterLayoutArchetype, PosterSlotMedia, QrPosition, SlotFitMode } from '@/types/index';
import type { LayerItemTarget, ResizeHandle, ResizeSession, SelectedEntity, StudioSceneState } from '@/lib/posters/studio-types';
import { getStudioQrPreviewClass } from '@/lib/posters/studio-types';
import { getArchetypeGridStyle, getCanvasBackgroundProps, getLayoutGapClass } from '@/lib/posters/layout-engine';
import { Columns, EyeOff, FileText, Upload } from 'lucide-react';
import { LayoutDividerHandle } from '../LayoutDividerHandle';
import { SafeZoneOverlayGuide } from '../SafeZoneOverlayGuide';
import { StudioCanvasFreeformLayer } from './StudioCanvasFreeformLayer';
import { StudioCanvasPartitionGrid } from './StudioCanvasPartitionGrid';
import { StudioCanvasStickersAndCompounds } from './StudioCanvasStickersAndCompounds';
import { StudioCanvasTextLayer } from './StudioCanvasTextLayer';
import { StudioUprightActionsBar } from './StudioUprightActionsBar';
import { StudioGroupBoundsOverlay } from './StudioGroupBoundsOverlay';

interface StudioCanvasStageProps {
  readonly canvasRef: React.RefObject<HTMLDivElement | null>;
  readonly scene: StudioSceneState;
  readonly archetype: PosterLayoutArchetype;
  readonly splitRatio: number;
  readonly gridGap: LayoutGridGap;
  readonly canvasBackground: CanvasBackgroundPreset;
  readonly canvasBackgroundCustom: string;
  readonly hasQr: boolean;
  readonly qrUrl: string;
  readonly qrLabel: string;
  readonly qrPosition: QrPosition;
  readonly showPreviewQr: boolean;
  readonly showSafeZone: boolean;
  readonly selectedSlotIndex: number | null;
  readonly selectedEntity: SelectedEntity | null;
  readonly selectedLayerKeys: readonly string[];
  readonly isAspectLocked: boolean;
  readonly draggingFreeformSlotId: string | null;
  readonly draggingStickerId: string | null;
  readonly draggingCompoundId: string | null;
  readonly draggingTextId: string | null;
  readonly isSnappedCenterX: boolean;
  readonly isSnappedCenterY: boolean;
  readonly groupBounds: { left: number; top: number; width: number; height: number } | null;
  readonly isItemLocked: (item: { readonly is_locked?: boolean | undefined; readonly layer_folder_id?: string | undefined } | null | undefined) => boolean;
  readonly onCanvasPointerMove: (e: React.PointerEvent) => void;
  readonly onCanvasPointerUp: (e: React.PointerEvent) => void;
  readonly onDropFiles: (files: FileList) => void;
  readonly onPickUploadFiles: () => void;
  readonly onAddNotice: () => void;
  readonly onDeselectAll: () => void;
  readonly onSelectSlot: (idx: number | null) => void;
  readonly onToggleLayerSelection: (key: string) => void;
  readonly onReorderSlot: (from: number, to: number) => void;
  readonly onCommitSlots: (slots: PosterSlotMedia[]) => void;
  readonly onRequestReplaceSlot: (idx: number) => void;
  readonly onFreeformSlotPointerDown: (e: React.PointerEvent, id: string, idx: number) => void;
  readonly onStickerPointerDown: (e: React.PointerEvent, stk: StudioSceneState['stickers'][number], idx: number) => void;
  readonly onCompoundPointerDown: (e: React.PointerEvent, id: string) => void;
  readonly onTextPointerDown: (e: React.PointerEvent, id: string) => void;
  readonly onStartEditingText?: ((textId: string) => void) | undefined;
  readonly onCommitText?: ((textId: string, nextText: string) => void) | undefined;
  readonly onStartResizing: (e: React.PointerEvent, type: ResizeSession['type'], id: string, handle: ResizeHandle, p: { pos_x: number; pos_y: number; width_percent: number; height_percent: number }) => void;
  readonly onMultiDragStart: (e: React.PointerEvent) => void;
  readonly onStartMultiResizing: (e: React.PointerEvent, handle: ResizeHandle) => void;
  readonly onGroupIntoFolder: () => void;
  readonly onMergeIntoCompound: () => void;
  readonly onToggleLockSelected: () => void;
  readonly onDeleteSelected: () => void;
  readonly onMoveUp: (t: LayerItemTarget) => void;
  readonly onMoveDown: (t: LayerItemTarget) => void;
  readonly onToggleLock: (t: LayerItemTarget) => void;
  readonly onDuplicate: (t: LayerItemTarget) => void;
  readonly onDelete: (t: LayerItemTarget) => void;
  readonly onUnmergeCompound: (id: string) => void;
  readonly onPatchEntity: (entity: SelectedEntity, patch: { flip_x?: boolean; flip_y?: boolean; rotation?: number; fit_mode?: SlotFitMode }) => void;
  readonly onChangeSplitRatio: (ratio: number) => void;
  readonly onHidePreviewQr: () => void;
}

/** Interactive 16:9 Studio Canvas Stage hosting freeform/partition views, floating layers, guides, and QR card. */
export function StudioCanvasStage(props: StudioCanvasStageProps) {
  const { scene, archetype, canvasBackground, canvasBackgroundCustom, hasQr, qrUrl, qrLabel, qrPosition } = props;
  const [draggedCanvasSlotIndex, setDraggedCanvasSlotIndex] = useState<number | null>(null);
  const [canvasDropTargetIndex, setCanvasDropTargetIndex] = useState<number | null>(null);

  const bgProps = getCanvasBackgroundProps(canvasBackground, canvasBackgroundCustom);
  const isEmpty = scene.slots.length === 0 && scene.compoundLayers.length === 0 && scene.stickers.length === 0 && scene.textOverlays.length === 0;

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) props.onDeselectAll(); }} className="flex-1 flex flex-col bg-[var(--admin-surface)]/50 p-4 md:p-6 overflow-y-auto justify-center items-center gap-4">
      <div
        ref={props.canvasRef}
        onPointerDown={(e) => { if (e.target === e.currentTarget) props.onDeselectAll(); }}
        onPointerMove={props.onCanvasPointerMove}
        onPointerUp={props.onCanvasPointerUp}
        onPointerCancel={props.onCanvasPointerUp}
        className={`relative w-full max-w-5xl mx-auto aspect-video max-h-[76vh] rounded-3xl border-4 border-slate-900 shadow-2xl overflow-hidden select-none ${bgProps.className}`}
        style={bgProps.style}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (draggedCanvasSlotIndex !== null || e.dataTransfer.types.includes('text/x-slot-index')) {
            setDraggedCanvasSlotIndex(null);
            setCanvasDropTargetIndex(null);
            return;
          }
          if (e.dataTransfer.files?.length) props.onDropFiles(e.dataTransfer.files);
        }}
      >
        {isEmpty ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="w-16 h-16 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center mb-4"><Columns className="w-8 h-8 opacity-70" /></div>
            <h3 className="text-xl font-bold mb-1">Add Media to Start Building</h3>
            <p className="text-xs text-slate-400 max-w-sm mb-6">Drop images or videos here, or choose an option below to create your multi-poster slide.</p>
            <div className="flex items-center gap-3">
              <button type="button" onClick={props.onPickUploadFiles} className="px-4 py-2 rounded-xl bg-[var(--admin-btn-primary-bg)] hover:bg-[var(--admin-btn-primary-hover)] text-[var(--admin-btn-primary-text)] font-semibold text-xs shadow-md transition cursor-pointer flex items-center gap-2">
                <Upload className="w-4 h-4" /><span>Upload Images / Videos</span>
              </button>
              <button type="button" onClick={props.onAddNotice} className="px-4 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-2">
                <FileText className="w-4 h-4" /><span>Add Notice Card</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full overflow-hidden select-none" onPointerDown={(e) => { if (e.target === e.currentTarget) props.onDeselectAll(); }}>
            {archetype === 'freeform' ? (
              <StudioCanvasFreeformLayer
                slots={scene.slots} selectedEntity={props.selectedEntity} selectedLayerKeys={props.selectedLayerKeys}
                draggingFreeformSlotId={props.draggingFreeformSlotId} isSnappedCenterX={props.isSnappedCenterX} isSnappedCenterY={props.isSnappedCenterY}
                isAspectLocked={props.isAspectLocked} isItemLocked={props.isItemLocked}
                onSlotPointerDown={props.onFreeformSlotPointerDown} onStartResizing={props.onStartResizing}
              />
            ) : (
              <StudioCanvasPartitionGrid
                slots={scene.slots} archetype={archetype}
                gridStyle={getArchetypeGridStyle(archetype, props.splitRatio, Math.max(1, scene.slots.length))}
                gapClass={getLayoutGapClass(props.gridGap)}
                selectedSlotIndex={props.selectedSlotIndex} selectedEntity={props.selectedEntity} selectedLayerKeys={props.selectedLayerKeys}
                draggedCanvasSlotIndex={draggedCanvasSlotIndex} canvasDropTargetIndex={canvasDropTargetIndex}
                setDraggedCanvasSlotIndex={setDraggedCanvasSlotIndex} setCanvasDropTargetIndex={setCanvasDropTargetIndex}
                onReorderSlot={props.onReorderSlot} onSelectSlot={(idx) => props.onSelectSlot(idx)}
                onToggleLayerSelection={props.onToggleLayerSelection} onCommitSlots={props.onCommitSlots}
                onRequestReplaceSlot={props.onRequestReplaceSlot}
              />
            )}

            <StudioCanvasStickersAndCompounds
              stickers={scene.stickers} compoundLayers={scene.compoundLayers} selectedEntity={props.selectedEntity}
              selectedLayerKeys={props.selectedLayerKeys} draggingStickerId={props.draggingStickerId} draggingCompoundId={props.draggingCompoundId}
              isAspectLocked={props.isAspectLocked} isItemLocked={props.isItemLocked}
              onStickerPointerDown={props.onStickerPointerDown} onCompoundPointerDown={props.onCompoundPointerDown} onStartResizing={props.onStartResizing}
            />
            <StudioCanvasTextLayer
              textOverlays={scene.textOverlays} selectedEntity={props.selectedEntity} selectedLayerKeys={props.selectedLayerKeys}
              draggingTextId={props.draggingTextId} isAspectLocked={props.isAspectLocked} isItemLocked={props.isItemLocked}
              onTextPointerDown={props.onTextPointerDown} onStartResizing={props.onStartResizing}
              onStartEditingText={props.onStartEditingText} onCommitText={props.onCommitText}
            />
            <StudioUprightActionsBar
              scene={scene} archetype={archetype} selectedEntity={props.selectedEntity} selectedCount={props.selectedLayerKeys.length}
              isItemLocked={props.isItemLocked} onMoveUp={props.onMoveUp} onMoveDown={props.onMoveDown}
              onToggleLock={props.onToggleLock} onDuplicate={props.onDuplicate} onDelete={props.onDelete}
              onUnmergeCompound={props.onUnmergeCompound} onPatchEntity={props.onPatchEntity}
            />
            <StudioGroupBoundsOverlay
              groupBounds={props.groupBounds} selectedCount={props.selectedLayerKeys.length} isAspectLocked={props.isAspectLocked}
              onMultiDragStart={props.onMultiDragStart} onStartMultiResizing={props.onStartMultiResizing}
              onGroupIntoFolder={props.onGroupIntoFolder} onMergeIntoCompound={props.onMergeIntoCompound}
              onToggleLockSelected={props.onToggleLockSelected} onDeleteSelected={props.onDeleteSelected}
            />
          </div>
        )}

        {scene.slots.length === 2 && (archetype === 'split_vertical' || archetype === 'split_horizontal') && (
          <LayoutDividerHandle orientation={archetype === 'split_vertical' ? 'vertical' : 'horizontal'} positionPercent={props.splitRatio} onMove={props.onChangeSplitRatio} onReset={() => props.onChangeSplitRatio(50)} />
        )}

        <SafeZoneOverlayGuide isVisible={props.showSafeZone} qrUrl={hasQr ? qrUrl : undefined} qrPosition={qrPosition} slotCount={scene.slots.length} />

        {props.showPreviewQr && hasQr && (
          <div className={`group absolute ${getStudioQrPreviewClass(qrPosition ?? 'bottom-left')} z-30 bg-neutral-900/95 backdrop-blur-xl border border-white/20 rounded-xl p-2.5 shadow-2xl flex items-center space-x-2.5 max-w-[260px] transition-all duration-300 pointer-events-auto`}>
            <div className="bg-white p-1 rounded-lg shrink-0 flex items-center justify-center">
              <QRCodeSVG value={qrUrl?.trim() || 'https://mosque.org'} size={44} level="M" fgColor="#000000" bgColor="#ffffff" />
            </div>
            <div className="min-w-0 pr-1 text-left flex-1">
              <span className="text-[11px] font-extrabold text-white block truncate leading-tight">{qrLabel?.trim() || 'Scan to Register'}</span>
              <span className="text-[9px] text-neutral-300 font-mono block truncate mt-0.5">{qrUrl?.trim() ? qrUrl.trim().replace(/^https?:\/\//i, '') : 'mosque.org/register'}</span>
            </div>
            <button type="button" onClick={(e) => { e.stopPropagation(); props.onHidePreviewQr(); }} className="opacity-0 group-hover:opacity-100 p-1 rounded-lg bg-black/80 hover:bg-black text-neutral-300 hover:text-white transition-opacity border border-white/20 cursor-pointer shrink-0" title="Hide QR in preview while editing (keeps QR on saved poster)" aria-label="Hide QR in preview">
              <EyeOff className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

