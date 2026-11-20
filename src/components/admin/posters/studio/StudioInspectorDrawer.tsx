'use client';

import React from 'react';
import type { useMultiAssetStudio } from '@/hooks/studio/useMultiAssetStudio';
import { StudioLayoutTab } from './StudioLayoutTab';
import { StudioLayersTab } from './StudioLayersTab';
import { StudioFramesTab } from './StudioFramesTab';
import { StudioStickersTab } from './StudioStickersTab';
import { StudioTextTab } from './StudioTextTab';
import { StudioQrTab } from './StudioQrTab';
import { StudioSettingsTab } from './StudioSettingsTab';

interface StudioInspectorDrawerProps {
  readonly studio: ReturnType<typeof useMultiAssetStudio>;
  readonly venueTimezone?: string | undefined;
}

/** Zone 2 sidebar inspector router displaying controls for the active Studio tool tab. */
export function StudioInspectorDrawer({ studio, venueTimezone }: StudioInspectorDrawerProps) {
  const { historyState, selection, lifecycle, layerActions, assetActions } = studio;
  const activeSlot = selection.selectedSlotIndex !== null ? historyState.slots[selection.selectedSlotIndex] : undefined;

  return (
    <div className="w-80 md:w-88 border-r border-[var(--admin-border)] bg-[var(--admin-card)] flex flex-col overflow-y-auto p-4 space-y-4 shrink-0 overscroll-contain">
      {lifecycle.activeTab === 'layout' && (
        <StudioLayoutTab
          archetype={lifecycle.archetype}
          canvasBackground={lifecycle.canvasBackground}
          canvasBackgroundCustom={lifecycle.canvasBackgroundCustom}
          gridGap={lifecycle.gridGap}
          splitRatio={lifecycle.splitRatio}
          slots={historyState.slots}
          onChangeArchetype={(a) => { lifecycle.setArchetype(a); historyState.isDirtyRef.current = true; }}
          onEnableFreeform={(updated) => { lifecycle.setArchetype('freeform'); historyState.commitSlots(updated); }}
          onChangeBackground={(bg) => { lifecycle.setCanvasBackground(bg); historyState.isDirtyRef.current = true; }}
          onChangeGridGap={(g) => { lifecycle.setGridGap(g); historyState.isDirtyRef.current = true; }}
          onToggleAllFitCover={assetActions.handleToggleAllFitCover}
          onChangeSplitRatio={(r) => { lifecycle.setSplitRatio(r); historyState.isDirtyRef.current = true; }}
        />
      )}

      {lifecycle.activeTab === 'layers' && (
        <StudioLayersTab
          scene={historyState.scene}
          isUploading={lifecycle.isUploading}
          selectedEntity={selection.selectedEntity}
          selectedSlotIndex={selection.selectedSlotIndex}
          selectedLayerKeys={selection.selectedLayerKeys}
          lastClickedLayerKey={selection.lastClickedLayerKey}
          setSelectedLayerKeys={selection.setSelectedLayerKeys}
          setLastClickedLayerKey={selection.setLastClickedLayerKey}
          setSlots={historyState.setSlots}
          setStickers={historyState.setStickers}
          setTextOverlays={historyState.setTextOverlays}
          setCompoundLayers={historyState.setCompoundLayers}
          setFolders={historyState.setFolders}
          setRootOrder={historyState.setRootOrder}
          commitSlots={historyState.commitSlots}
          selectSlot={selection.selectSlot}
          selectSticker={selection.selectSticker}
          selectText={selection.selectText}
          selectCompound={selection.selectCompound}
          deselectAll={selection.deselectAll}
          isDirtyRef={historyState.isDirtyRef}
          onPickMedia={() => lifecycle.fileInputRef.current?.click()}
          onAddNotice={assetActions.handleAddNoticeSlot}
          onAddText={assetActions.handleAddTextBanner}
          onReplaceSlotFile={assetActions.handleReplaceSlotFile}
          onGroupSelected={layerActions.handleGroupSelectedIntoFolder}
          onMergeSelected={layerActions.handleMergeSelectedIntoCompound}
          onLockSelected={layerActions.handleLockSelectedLayers}
          onDeleteSelected={layerActions.handleDeleteSelectedLayers}
          onReorderLayers={layerActions.handleReorderLayers}
          onUnmergeCompound={layerActions.handleUnmergeCompound}
          onMoveUp={layerActions.handleMoveLayerUp}
          onMoveDown={layerActions.handleMoveLayerDown}
          onToggleLock={layerActions.toggleItemLock}
          onDuplicate={layerActions.handleDuplicateLayer}
          onDelete={layerActions.handleDeleteLayer}
          onMoveFolder={layerActions.handleMoveFolder}
          onToggleFolderLock={layerActions.handleToggleFolderLock}
          onDuplicateFolder={layerActions.handleDuplicateFolder}
          onUngroupFolder={layerActions.handleUngroupFolder}
          onDeleteFolderAndContents={layerActions.handleDeleteFolderAndContents}
        />
      )}

      {lifecycle.activeTab === 'frames' && (
        <StudioFramesTab
          activeSlot={activeSlot}
          selectedSlotIndex={selection.selectedSlotIndex}
          totalSlots={historyState.slots.length}
          frameApplyScope={lifecycle.frameApplyScope}
          onChangeScope={lifecycle.setFrameApplyScope}
          onChangeFrameStyle={assetActions.handleFrameStyleChange}
        />
      )}

      {lifecycle.activeTab === 'stickers' && (
        <StudioStickersTab
          stickers={historyState.stickers}
          selectedStickerIndex={selection.selectedStickerIndex}
          customBadgeText={lifecycle.customBadgeText}
          customBadgeVariant={lifecycle.customBadgeVariant}
          setCustomBadgeText={lifecycle.setCustomBadgeText}
          setCustomBadgeVariant={lifecycle.setCustomBadgeVariant}
          onUpdateSticker={studio.handleUpdateSticker}
          onDeleteSticker={studio.handleDeleteSticker}
          onAddIslamicSticker={assetActions.handleAddIslamicSticker}
          onAddBadgeSticker={assetActions.handleAddBadgeSticker}
        />
      )}

      {lifecycle.activeTab === 'text' && (
        <StudioTextTab
          textOverlays={historyState.textOverlays}
          onAddBanner={assetActions.handleAddTextBanner}
          onDeleteBanner={(idx) => {
            historyState.setTextOverlays((p) => p.filter((_, i) => i !== idx));
            historyState.isDirtyRef.current = true;
          }}
          onPatchOverlay={studio.handlePatchTextOverlay}
          onEyeDropper={assetActions.handleEyeDropper}
          onBgEyeDropper={assetActions.handleBgEyeDropper}
        />
      )}

      {lifecycle.activeTab === 'qr' && (
        <StudioQrTab
          hasQr={lifecycle.hasQr}
          qrUrl={lifecycle.qrUrl}
          qrLabel={lifecycle.qrLabel}
          qrPosition={lifecycle.qrPosition}
          showPreviewQr={lifecycle.showPreviewQr}
          onChangeHasQr={(v) => { lifecycle.setHasQr(v); historyState.isDirtyRef.current = true; }}
          onChangeQrUrl={(v) => { lifecycle.setQrUrl(v); historyState.isDirtyRef.current = true; }}
          onChangeQrLabel={(v) => { lifecycle.setQrLabel(v); historyState.isDirtyRef.current = true; }}
          onChangeQrPosition={(p) => { lifecycle.setQrPosition(p); historyState.isDirtyRef.current = true; }}
          onTogglePreviewQr={() => lifecycle.setShowPreviewQr((p) => !p)}
        />
      )}

      {lifecycle.activeTab === 'settings' && (
        <StudioSettingsTab
          title={lifecycle.title}
          duration={lifecycle.duration}
          startAt={lifecycle.startAt}
          endAt={lifecycle.endAt}
          isIndefinite={lifecycle.isIndefinite}
          recurringSchedule={lifecycle.recurringSchedule}
          onChangeTitle={(v) => { lifecycle.setTitle(v); historyState.isDirtyRef.current = true; }}
          onChangeDuration={(d) => { lifecycle.setDuration(d); historyState.isDirtyRef.current = true; }}
          onChangeStartAt={(s) => { lifecycle.setStartAt(s); historyState.isDirtyRef.current = true; }}
          onChangeEndAt={(e) => { lifecycle.setEndAt(e); historyState.isDirtyRef.current = true; }}
          onChangeIndefinite={(i) => { lifecycle.setIsIndefinite(i); historyState.isDirtyRef.current = true; }}
          onChangeRecurringSchedule={(r) => { lifecycle.setRecurringSchedule(r); historyState.isDirtyRef.current = true; }}
          venueTimezone={venueTimezone}
        />
      )}
    </div>
  );
}

