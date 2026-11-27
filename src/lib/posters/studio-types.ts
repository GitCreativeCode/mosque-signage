import type {
  Poster,
  PosterSlotMedia,
  PosterTextOverlay,
  PosterCanvasSticker,
  PosterLayerFolder,
  PosterCompoundLayer,
  NoticeTheme,
  QrPosition,
} from '@/types/index';

export interface MultiAssetStudioModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSaved: () => void;
  readonly initialPoster?: Poster | null | undefined;
  readonly initialFiles?: File[] | undefined;
  readonly initialNotice?:
    | {
        readonly headline: string;
        readonly description: string;
        readonly theme?: NoticeTheme | undefined;
      }
    | undefined;
  readonly venueTimezone?: string | undefined;
}

export interface StudioHistorySnapshot {
  readonly slots: readonly PosterSlotMedia[];
  readonly stickers: readonly PosterCanvasSticker[];
  readonly textOverlays: readonly PosterTextOverlay[];
  readonly compoundLayers: readonly PosterCompoundLayer[];
  readonly folders: readonly PosterLayerFolder[];
  readonly rootOrder: readonly string[];
  readonly actionLabel?: string | undefined;
}

export interface StudioSceneState {
  readonly slots: PosterSlotMedia[];
  readonly stickers: PosterCanvasSticker[];
  readonly textOverlays: PosterTextOverlay[];
  readonly compoundLayers: PosterCompoundLayer[];
  readonly folders: PosterLayerFolder[];
  readonly rootOrder: string[];
}

export type StudioTab = 'layout' | 'layers' | 'frames' | 'stickers' | 'text' | 'qr' | 'settings';
export type SelectedEntityType = 'slot' | 'sticker' | 'text' | 'compound';

export interface SelectedEntity {
  readonly type: SelectedEntityType;
  readonly id: string;
}

export interface LayerItemTarget {
  readonly type: SelectedEntityType;
  readonly itemIdx?: number | undefined;
  readonly id: string;
}

export interface MultiDragSession {
  readonly mouseX: number;
  readonly mouseY: number;
  readonly initialSlots: { id: string; x: number; y: number }[];
  readonly initialStickers: { id: string; x: number; y: number }[];
  readonly initialTexts: { id: string; x: number; y: number }[];
  readonly initialCompounds: { id: string; x: number; y: number }[];
}

export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e';

export interface MultiResizeRelativeItem {
  readonly id: string;
  readonly relX: number;
  readonly relY: number;
  readonly relW: number;
  readonly relH: number;
}

export interface MultiResizeSession {
  readonly handle: ResizeHandle;
  readonly mouseX: number;
  readonly mouseY: number;
  readonly initialGroup: { left: number; top: number; width: number; height: number };
  readonly initialSlots: MultiResizeRelativeItem[];
  readonly initialStickers: MultiResizeRelativeItem[];
  readonly initialTexts: MultiResizeRelativeItem[];
  readonly initialCompounds: MultiResizeRelativeItem[];
}

export interface DragBoundsStart {
  readonly mouseX: number;
  readonly mouseY: number;
  readonly initialX: number;
  readonly initialY: number;
  readonly initialW: number;
  readonly initialH: number;
}

export interface ResizeSession extends DragBoundsStart {
  readonly type: 'slot' | 'sticker' | 'compound' | 'text';
  readonly id: string;
  readonly handle: ResizeHandle;
  readonly aspectRatio: number;
  readonly initialFontSize?: number | undefined;
  readonly initialScaleX?: number | undefined;
  readonly initialScaleY?: number | undefined;
  readonly rotation?: number | undefined;
}

export interface DropIndicatorState {
  readonly targetKey: string;
  readonly position: 'before' | 'after' | 'inside';
}

export const DEFAULT_TEXT_COLORS = [
  { label: 'White', hex: '#ffffff' },
  { label: 'Dark', hex: '#0a0a0a' },
  { label: 'Mosque Green', hex: '#15803d' },
  { label: 'Sacred Gold', hex: '#eab308' },
  { label: 'Warm Amber', hex: '#d97706' },
  { label: 'Deep Ruby', hex: '#dc2626' },
  { label: 'Midnight Navy', hex: '#1e3a8a' },
  { label: 'Desert Sand', hex: '#fef3c7' },
] as const;

export const DEFAULT_RECTANGLE_COLORS = [
  { label: 'Transparent (No Background)', hex: 'transparent' },
  { label: 'Solid Charcoal', hex: '#0f172a' },
  { label: 'Deep Black', hex: '#000000' },
  { label: 'Mosque Green', hex: '#14532d' },
  { label: 'Warm Amber', hex: '#b45309' },
  { label: 'Crimson Ruby', hex: '#881337' },
  { label: 'Navy Blue', hex: '#1e3a8a' },
  { label: 'Frosted Slate', hex: '#334155' },
  { label: 'Crisp White', hex: '#ffffff' },
] as const;

export function getStudioQrPreviewClass(pos: QrPosition = 'bottom-left'): string {
  switch (pos) {
    case 'top-left':
      return 'top-3 left-3';
    case 'top-center':
      return 'top-3 left-1/2 -translate-x-1/2';
    case 'top-right':
      return 'top-3 right-3';
    case 'bottom-center':
      return 'bottom-3 left-1/2 -translate-x-1/2';
    case 'bottom-right':
      return 'bottom-3 right-3';
    case 'bottom-left':
    default:
      return 'bottom-3 left-3';
  }
}
