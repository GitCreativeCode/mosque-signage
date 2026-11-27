'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { MultiAssetStudioModalProps } from '@/lib/posters/studio-types';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useIsSmallScreen } from '@/hooks/useIsSmallScreen';
import { useMultiAssetStudio } from '@/hooks/studio/useMultiAssetStudio';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { StudioDeviceRequiredModal } from './StudioDeviceRequiredModal';
import { StudioHeaderBar } from './studio/StudioHeaderBar';
import { StudioToolDock } from './studio/StudioToolDock';
import { StudioInspectorDrawer } from './studio/StudioInspectorDrawer';
import { StudioCanvasStage } from './studio/StudioCanvasStage';
import { StudioShortcutsModal } from './studio/StudioShortcutsModal';

export type { MultiAssetStudioModalProps } from '@/lib/posters/studio-types';

/** Interactive 3-zone Creative Layout Studio modal for composite slides, split screens, and freeform canvases. */
export function MultiAssetStudioModal(props: MultiAssetStudioModalProps) {
  const [mounted, setMounted] = useState(false);
  const { isSmallScreen } = useIsSmallScreen();
  const studio = useMultiAssetStudio(props);
  const { historyState, selection, lifecycle, pointer, layerActions, assetActions } = studio;

  useEffect(() => {
    setMounted(true);
  }, []);

  const trapRef = useFocusTrap<HTMLDivElement>({
    isActive: props.isOpen && !isSmallScreen && !lifecycle.showDiscardConfirm,
    onEscape: lifecycle.handleRequestClose,
  });

  if (!props.isOpen || !mounted) return null;

  if (isSmallScreen) {
    return createPortal(
      <StudioDeviceRequiredModal
        isOpen={props.isOpen}
        contextLabel={props.initialPoster?.title}
        onClose={props.onClose}
      />,
      document.body
    );
  }

  const content = (
    <>
      <div
        className="fixed inset-0 z-[100] w-screen h-screen bg-[var(--admin-bg)] flex flex-col overflow-hidden text-[var(--admin-text-primary)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="studio-modal-title"
      >
        <div
          ref={trapRef}
          className="relative w-full h-full flex flex-col bg-[var(--admin-card)] overflow-hidden text-[var(--admin-text-primary)]"
        >
          <StudioHeaderBar
            slotCount={historyState.slots.length}
            compoundCount={historyState.compoundLayers.length}
            archetype={lifecycle.archetype}
            activeTab={lifecycle.activeTab}
            hasQr={lifecycle.hasQr}
            showSafeZone={lifecycle.showSafeZone}
            showPreviewQr={lifecycle.showPreviewQr}
            historyIndex={historyState.historyIndex}
            historyLength={historyState.history.length}
            history={historyState.history}
            isSubmitting={lifecycle.isSubmitting}
            isUploading={lifecycle.isUploading}
            error={lifecycle.error}
            onToggleSafeZone={() => lifecycle.setShowSafeZone((p) => !p)}
            onTogglePreviewQr={() => lifecycle.setShowPreviewQr((p) => !p)}
            onUndo={studio.handleUndo}
            onRedo={studio.handleRedo}
            onJumpToHistory={(idx) => historyState.jumpToHistoryIndex(idx, selection.deselectAll)}
            onDuplicateSlide={lifecycle.handleDuplicateSlide}
            onSave={lifecycle.handleSave}
            onClose={lifecycle.handleRequestClose}
            onClearError={() => lifecycle.setError(null)}
          />

          <input ref={lifecycle.fileInputRef} type="file" multiple accept="image/*,video/*" onChange={assetActions.handleAddMediaFiles} className="hidden" />
          <input ref={lifecycle.canvasDropInputRef} type="file" multiple accept="image/*,video/*" onChange={assetActions.handleAddMediaFiles} className="hidden" />
          <input
            ref={lifecycle.slotReplaceInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) assetActions.handleReplaceSlotFile(f);
              if (lifecycle.slotReplaceInputRef.current) lifecycle.slotReplaceInputRef.current.value = '';
            }}
            className="hidden"
          />

          <div className="flex-1 flex overflow-hidden">
            <StudioToolDock
              activeTab={lifecycle.activeTab}
              onSelectTab={lifecycle.setActiveTab}
              onShowShortcuts={() => lifecycle.setShowShortcutsModal(true)}
            />
            <StudioInspectorDrawer studio={studio} venueTimezone={props.venueTimezone} />
            <StudioCanvasStage
              canvasRef={lifecycle.canvasRef}
              scene={historyState.scene}
              archetype={lifecycle.archetype}
              splitRatio={lifecycle.splitRatio}
              gridGap={lifecycle.gridGap}
              canvasBackground={lifecycle.canvasBackground}
              canvasBackgroundCustom={lifecycle.canvasBackgroundCustom}
              hasQr={lifecycle.hasQr}
              qrUrl={lifecycle.qrUrl}
              qrLabel={lifecycle.qrLabel}
              qrPosition={lifecycle.qrPosition}
              durationSeconds={lifecycle.duration}
              showPreviewQr={lifecycle.showPreviewQr}
              showSafeZone={lifecycle.showSafeZone}
              selectedSlotIndex={selection.selectedSlotIndex}
              selectedEntity={selection.selectedEntity}
              selectedLayerKeys={selection.selectedLayerKeys}
              isAspectLocked={lifecycle.isAspectLocked}
              draggingFreeformSlotId={pointer.draggingFreeformSlotId}
              draggingStickerId={pointer.draggingStickerId}
              draggingCompoundId={pointer.draggingCompoundId}
              draggingTextId={pointer.draggingTextId}
              isSnappedCenterX={pointer.isSnappedCenterX}
              isSnappedCenterY={pointer.isSnappedCenterY}
              groupBounds={pointer.groupBounds}
              isItemLocked={selection.isItemLocked}
              onCanvasPointerMove={pointer.handleCanvasPointerMove}
              onCanvasPointerUp={pointer.handleCanvasPointerUp}
              onDropFiles={(files) => assetActions.handleAddMediaFiles({ target: { files } } as unknown as React.ChangeEvent<HTMLInputElement>)}
              onPickUploadFiles={() => lifecycle.canvasDropInputRef.current?.click()}
              onAddNotice={assetActions.handleAddNoticeSlot}
              onDeselectAll={selection.deselectAll}
              onSelectSlot={selection.selectSlot}
              onToggleLayerSelection={selection.toggleLayerSelection}
              onSelectMultipleKeys={selection.selectMultipleKeys}
              onReorderSlot={layerActions.handleReorderSlot}
              onCommitSlots={historyState.commitSlots}
              onRequestReplaceSlot={(idx) => {
                selection.setSelectedSlotIndex(idx);
                lifecycle.slotReplaceInputRef.current?.click();
              }}
              onFreeformSlotPointerDown={pointer.handleFreeformSlotPointerDown}
              onStickerPointerDown={pointer.handleStickerPointerDown}
              onCompoundPointerDown={pointer.handleCompoundPointerDown}
              onTextPointerDown={pointer.handleTextPointerDown}
              onStartEditingText={(id) => {
                const idx = historyState.scene.textOverlays.findIndex((t) => t.id === id);
                if (idx !== -1) selection.selectText(idx);
                lifecycle.setActiveTab('text');
              }}
              onCommitText={(id, nextText) => {
                const s = historyState.scene;
                if (!nextText.trim()) {
                  const nextOverlays = s.textOverlays.filter((t) => t.id !== id);
                  historyState.commitScene({ ...s, textOverlays: nextOverlays }, 'Delete Empty Text');
                  selection.deselectAll();
                } else {
                  const nextOverlays = s.textOverlays.map((t) => (t.id === id ? { ...t, text: nextText } : t));
                  historyState.commitScene({ ...s, textOverlays: nextOverlays }, 'Edit Text');
                }
              }}
              onStartResizing={pointer.handleStartResizing}
              onMultiDragStart={pointer.handleMultiDragStart}
              onStartMultiResizing={pointer.handleStartMultiResizing}
              onGroupIntoFolder={layerActions.handleGroupSelectedIntoFolder}
              onDuplicateSelected={layerActions.handleDuplicateSelectedLayers}
              onAlignSelected={layerActions.handleAlignSelectedLayers}
              onBatchBringToFront={layerActions.handleBatchBringToFront}
              onBatchSendToBack={layerActions.handleBatchSendToBack}
              onBatchFlipHorizontal={() => layerActions.handleBatchFlip('h')}
              onBatchFlipVertical={() => layerActions.handleBatchFlip('v')}
              onMergeIntoCompound={layerActions.handleMergeSelectedIntoCompound}
              onToggleLockSelected={layerActions.handleLockSelectedLayers}
              onDeleteSelected={layerActions.handleDeleteSelectedLayers}
              onMoveUp={layerActions.handleMoveLayerUp}
              onMoveDown={layerActions.handleMoveLayerDown}
              onBringToFront={layerActions.handleBringToFront}
              onSendToBack={layerActions.handleSendToBack}
              onAddTextBanner={assetActions.handleAddTextBanner}
              onOpenStickersTab={() => lifecycle.setActiveTab('stickers')}
              onToggleLock={layerActions.toggleItemLock}
              onDuplicate={layerActions.handleDuplicateLayer}
              onDelete={layerActions.handleDeleteLayer}
              onUnmergeCompound={layerActions.handleUnmergeCompound}
              onPatchEntity={studio.handlePatchEntity}
              onChangeSplitRatio={(val) => {
                lifecycle.setSplitRatio(val);
                historyState.isDirtyRef.current = true;
              }}
              onHidePreviewQr={() => lifecycle.setShowPreviewQr(false)}
            />
          </div>
        </div>
      </div>

      <StudioShortcutsModal isOpen={lifecycle.showShortcutsModal} onClose={() => lifecycle.setShowShortcutsModal(false)} />

      <ConfirmationModal
        isOpen={lifecycle.showDiscardConfirm}
        title="Discard Unsaved Layout Changes?"
        message="You have unsaved layout partitions, frames, or text. Discarding will lose all recent edits."
        confirmLabel="Discard Changes"
        cancelLabel="Continue Editing"
        variant="danger"
        onConfirm={() => {
          lifecycle.setShowDiscardConfirm(false);
          historyState.isDirtyRef.current = false;
          props.onClose();
        }}
        onCancel={() => lifecycle.setShowDiscardConfirm(false)}
      />
    </>
  );

  return createPortal(content, document.body);
}
