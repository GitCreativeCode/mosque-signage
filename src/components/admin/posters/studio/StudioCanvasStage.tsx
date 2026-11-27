'use client';

import React, { useState } from 'react';
import type { CanvasBackgroundPreset, LayoutGridGap, PosterLayoutArchetype, PosterSlotMedia, QrPosition, SlotFitMode } from '@/types/index';
import type { LayerItemTarget, ResizeHandle, ResizeSession, SelectedEntity, StudioSceneState } from '@/lib/posters/studio-types';
import { getArchetypeGridStyle, getCanvasBackgroundProps, getLayoutGapClass } from '@/lib/posters/layout-engine';
import { LayoutDividerHandle } from '../LayoutDividerHandle';
import { SafeZoneOverlayGuide } from '../SafeZoneOverlayGuide';
import { StudioCanvasFreeformLayer } from './StudioCanvasFreeformLayer';
import { StudioCanvasPartitionGrid } from './StudioCanvasPartitionGrid';
import { StudioCanvasStickersAndCompounds } from './StudioCanvasStickersAndCompounds';
import { StudioCanvasTextLayer, type TextResizeInitialProps } from './StudioCanvasTextLayer';
import { StudioGroupBoundsOverlay } from './StudioGroupBoundsOverlay';
import { StudioCanvasBottomBar } from './StudioCanvasBottomBar';
import { StudioCanvasContextMenu } from './StudioCanvasContextMenu';
import type { LayerAlignment } from '@/lib/posters/studio-bounds';
import { StudioStageEmptyPrompt } from './StudioStageEmptyPrompt';
import { StudioStageQrOverlay } from './StudioStageQrOverlay';
import { useStudioCanvasViewport } from '@/hooks/studio/useStudioCanvasViewport';
import { StudioCanvasSelectionOutline } from './StudioCanvasSelectionOutline';
import { useStudioCanvasMarquee } from '@/hooks/studio/useStudioCanvasMarquee';
import { useStudioCanvasContextMenu } from '@/hooks/studio/useStudioCanvasContextMenu';

export interface StudioCanvasStageProps {
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
  readonly durationSeconds?: number | undefined;
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
  readonly onAddTextBanner?: () => void;
  readonly onOpenStickersTab?: () => void;
  readonly onDeselectAll: () => void;
  readonly onSelectSlot: (idx: number | null) => void;
  readonly onToggleLayerSelection: (key: string) => void;
  readonly onSelectMultipleKeys?: ((keys: string[]) => void) | undefined;
  readonly onReorderSlot: (from: number, to: number) => void;
  readonly onCommitSlots: (slots: PosterSlotMedia[]) => void;
  readonly onRequestReplaceSlot: (idx: number) => void;
  readonly onFreeformSlotPointerDown: (e: React.PointerEvent, id: string, idx: number) => void;
  readonly onStickerPointerDown: (e: React.PointerEvent, stk: StudioSceneState['stickers'][number], idx: number) => void;
  readonly onCompoundPointerDown: (e: React.PointerEvent, id: string) => void;
  readonly onTextPointerDown: (e: React.PointerEvent, id: string) => void;
  readonly onStartEditingText?: (textId: string) => void;
  readonly onCommitText?: (textId: string, nextText: string) => void;
  readonly onStartResizing: (e: React.PointerEvent, type: ResizeSession['type'], id: string, handle: ResizeHandle, p: TextResizeInitialProps) => void;
  readonly onMultiDragStart: (e: React.PointerEvent) => void;
  readonly onStartMultiResizing: (e: React.PointerEvent, handle: ResizeHandle) => void;
  readonly onGroupIntoFolder: () => void; readonly onMergeIntoCompound: () => void;
  readonly onDuplicateSelected?: (() => void) | undefined; readonly onAlignSelected?: ((alignment: LayerAlignment) => void) | undefined;
  readonly onBatchBringToFront?: (() => void) | undefined; readonly onBatchSendToBack?: (() => void) | undefined;
  readonly onBatchFlipHorizontal?: (() => void) | undefined; readonly onBatchFlipVertical?: (() => void) | undefined;
  readonly onToggleLockSelected: () => void; readonly onDeleteSelected: () => void; readonly onUnmergeCompound: (id: string) => void;
  readonly onMoveUp: (t: LayerItemTarget) => void; readonly onMoveDown: (t: LayerItemTarget) => void;
  readonly onBringToFront?: (t: LayerItemTarget) => void; readonly onSendToBack?: (t: LayerItemTarget) => void;
  readonly onToggleLock: (t: LayerItemTarget) => void; readonly onDuplicate: (t: LayerItemTarget) => void; readonly onDelete: (t: LayerItemTarget) => void;
  readonly onPatchEntity: (entity: SelectedEntity, patch: { flip_x?: boolean; flip_y?: boolean; rotation?: number; fit_mode?: SlotFitMode; pos_x?: number; pos_y?: number }) => void;
  readonly onChangeSplitRatio: (ratio: number) => void;
  readonly onHidePreviewQr: () => void;
}

/** Interactive 16:9 Studio Canvas Stage with cursor-anchored zoom/pan and docked status bar. */
export function StudioCanvasStage(props: StudioCanvasStageProps) {
  const { scene, archetype, canvasBackground, canvasBackgroundCustom, hasQr, qrUrl, qrLabel, qrPosition } = props;
  const [draggedCanvasSlotIndex, setDraggedCanvasSlotIndex] = useState<number | null>(null);
  const [canvasDropTargetIndex, setCanvasDropTargetIndex] = useState<number | null>(null);

  const viewport = useStudioCanvasViewport();
  const bgProps = getCanvasBackgroundProps(canvasBackground, canvasBackgroundCustom);
  const isEmpty = scene.slots.length === 0 && scene.compoundLayers.length === 0 && scene.stickers.length === 0 && scene.textOverlays.length === 0;

  const ctxMenu = useStudioCanvasContextMenu({
    selectedLayerKeys: props.selectedLayerKeys, selectedEntity: props.selectedEntity,
    scene, canvasRef: props.canvasRef, isItemLocked: props.isItemLocked,
    onSelectSlot: props.onSelectSlot, onToggleLayerSelection: props.onToggleLayerSelection,
    onDeselectAll: props.onDeselectAll,
  });

  const marquee = useStudioCanvasMarquee({
    scene, archetype, canvasRef: props.canvasRef,
    isPanningOrSpace: viewport.isSpacePressed || viewport.isPanning,
    onCanvasPointerMove: props.onCanvasPointerMove,
    onCanvasPointerUp: props.onCanvasPointerUp,
    onSelectMultipleKeys: props.onSelectMultipleKeys,
    onDeselectAll: props.onDeselectAll,
    handleStagePointerDown: ctxMenu.handleStagePointerDown,
  });

  return (
    <div
      ref={viewport.containerRef}
      onPointerDown={ctxMenu.handleStagePointerDown}
      onContextMenu={ctxMenu.handleContextMenu}
      className={`flex-1 flex flex-col bg-[var(--admin-surface)]/50 overflow-hidden relative select-none ${
        viewport.isPanning ? 'cursor-grabbing' : viewport.isSpacePressed ? 'cursor-grab' : ''
      }`}
    >
      <div className="flex-1 flex items-center justify-center p-3 sm:p-5 overflow-hidden w-full">
        <div
          ref={props.canvasRef}
          data-studio-canvas="true"
          onPointerDown={marquee.handleCanvasPointerDown}
          onPointerMove={marquee.handleStagePointerMove}
          onPointerUp={marquee.handleStagePointerUp}
          onPointerCancel={marquee.handleStagePointerUp}
          className={`relative w-full max-w-5xl aspect-video max-h-[76vh] rounded-2xl shadow-2xl overflow-hidden select-none ${bgProps.className}`}
          style={{ ...bgProps.style, ...viewport.viewportStyle }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (draggedCanvasSlotIndex !== null || e.dataTransfer.types.includes('text/x-slot-index')) {
              setDraggedCanvasSlotIndex(null); setCanvasDropTargetIndex(null); return;
            }
            if (e.dataTransfer.files?.length) props.onDropFiles(e.dataTransfer.files);
          }}
        >
          <StudioCanvasSelectionOutline
            selectedLayerKeys={props.selectedLayerKeys}
            selectedEntity={props.selectedEntity}
            scene={scene}
            archetype={archetype}
          />

          {marquee.marqueeSession && (
            <div
              style={{
                position: 'absolute',
                left: `${Math.min(marquee.marqueeSession.startX, marquee.marqueeSession.currentX)}%`,
                top: `${Math.min(marquee.marqueeSession.startY, marquee.marqueeSession.currentY)}%`,
                width: `${Math.abs(marquee.marqueeSession.currentX - marquee.marqueeSession.startX)}%`,
                height: `${Math.abs(marquee.marqueeSession.currentY - marquee.marqueeSession.startY)}%`,
                zIndex: 60,
              }}
              className="border-2 border-dashed border-amber-400 bg-amber-400/10 pointer-events-none rounded"
            />
          )}

          {isEmpty ? (
            <StudioStageEmptyPrompt onPickUploadFiles={props.onPickUploadFiles} onAddNotice={props.onAddNotice} />
          ) : (
            <div style={{ containerType: 'inline-size' }} className={`relative w-full h-full overflow-hidden select-none ${viewport.isSpacePressed || viewport.isPanning ? 'pointer-events-none' : ''}`} onPointerDown={ctxMenu.handleStagePointerDown}>
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
              <StudioGroupBoundsOverlay
                groupBounds={props.groupBounds} selectedCount={props.selectedLayerKeys.length} isAspectLocked={props.isAspectLocked}
                onMultiDragStart={props.onMultiDragStart} onStartMultiResizing={props.onStartMultiResizing}
              />
              {props.isSnappedCenterX && <div className="absolute inset-y-0 left-1/2 w-[2px] bg-amber-400 z-[950] pointer-events-none shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-pulse" />}
              {props.isSnappedCenterY && <div className="absolute inset-x-0 top-1/2 h-[2px] bg-amber-400 z-[950] pointer-events-none shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-pulse" />}
            </div>
          )}

          {scene.slots.length === 2 && (archetype === 'split_vertical' || archetype === 'split_horizontal') && (
            <LayoutDividerHandle orientation={archetype === 'split_vertical' ? 'vertical' : 'horizontal'} positionPercent={props.splitRatio} onMove={props.onChangeSplitRatio} onReset={() => props.onChangeSplitRatio(50)} />
          )}

          <SafeZoneOverlayGuide isVisible={props.showSafeZone} qrUrl={hasQr ? qrUrl : undefined} qrPosition={qrPosition} slotCount={scene.slots.length} />

          <StudioStageQrOverlay
            isVisible={props.showPreviewQr} hasQr={hasQr} qrUrl={qrUrl} qrLabel={qrLabel}
            qrPosition={qrPosition} onHidePreviewQr={props.onHidePreviewQr}
          />
        </div>
      </div>

      <StudioCanvasBottomBar
        scene={scene} archetype={archetype} durationSeconds={props.durationSeconds}
        zoom={viewport.zoom} panX={viewport.panX} panY={viewport.panY} maxPanX={viewport.maxPanX} onSetPanXDirect={viewport.setPanXDirect}
        onZoomIn={viewport.zoomIn} onZoomOut={viewport.zoomOut} onSetZoomLevel={viewport.setZoomLevel} onResetViewport={viewport.resetViewport}
        hasSelectedEntity={Boolean(props.selectedEntity)} onDeselectAll={props.onDeselectAll}
      />

      <StudioCanvasContextMenu
        menu={ctxMenu.contextMenu} selectedCount={props.selectedLayerKeys.length} onClose={() => ctxMenu.setContextMenu(null)}
        onGroupSelected={props.onGroupIntoFolder} onMergeSelected={props.onMergeIntoCompound}
        onDuplicateSelected={props.onDuplicateSelected} onAlignSelected={props.onAlignSelected}
        onBatchBringToFront={props.onBatchBringToFront} onBatchSendToBack={props.onBatchSendToBack}
        onBatchFlipHorizontal={props.onBatchFlipHorizontal} onBatchFlipVertical={props.onBatchFlipVertical}
        onToggleLockSelected={props.onToggleLockSelected} onDeleteSelected={props.onDeleteSelected}
        onBringToFront={props.onBringToFront ?? props.onMoveUp} onBringForward={props.onMoveUp}
        onSendBackward={props.onMoveDown} onSendToBack={props.onSendToBack ?? props.onMoveDown}
        onDuplicate={props.onDuplicate} onToggleLock={props.onToggleLock}
        onCenterEntity={(entity) => props.onPatchEntity(entity, { pos_x: 50, pos_y: 50 })}
        onFlipHorizontal={(entity) => props.onPatchEntity(entity, { flip_x: true })}
        onFlipVertical={(entity) => props.onPatchEntity(entity, { flip_y: true })}
        onDeleteLayer={props.onDelete} onPickUploadFiles={props.onPickUploadFiles}
        onAddNotice={props.onAddNotice} onAddTextBanner={props.onAddTextBanner ?? (() => {})}
        onOpenStickersTab={props.onOpenStickersTab ?? (() => {})} onResetViewport={viewport.resetViewport} onDeselectAll={props.onDeselectAll}
      />
    </div>
  );
}
