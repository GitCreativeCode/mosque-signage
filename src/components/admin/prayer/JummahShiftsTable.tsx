'use client';

import React from 'react';
import type { DbJummahShiftRecord } from '@/lib/actions/jummah';
import { format12h } from '@/lib/utils/time';
import { GripVertical, ChevronUp, ChevronDown, Pencil, Trash2 } from 'lucide-react';

export interface JummahShiftsTableProps {
  readonly shifts: readonly DbJummahShiftRecord[];
  readonly draggedIndex: number | null;
  readonly dragOverIndex: number | null;
  readonly onDragStart: (e: React.DragEvent, index: number) => void;
  readonly onDragOver: (e: React.DragEvent, index: number) => void;
  readonly onDrop: (e: React.DragEvent, targetIndex: number) => void;
  readonly onDragEnd: () => void;
  readonly onMoveShift: (index: number, direction: -1 | 1) => void;
  readonly onOpenEditShift: (shift: DbJummahShiftRecord) => void;
  readonly onDeleteShift: (id: string) => void;
}

/**
 * Friday Jummah Multi-Shift Table
 * Compact, reorderable table featuring native HTML5 drag-and-drop,
 * 1-click move up/down controls, formatted times, and optional Khateeb display.
 */
export function JummahShiftsTable({
  shifts,
  draggedIndex,
  dragOverIndex,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onMoveShift,
  onOpenEditShift,
  onDeleteShift,
}: JummahShiftsTableProps) {
  if (shifts.length === 0) {
    return (
      <div className="p-8 text-center bg-[#181a20] border border-[#2e323b] rounded-xl text-neutral-400 text-xs">
        No Friday Jummah Khutbahs configured. Click &ldquo;Add Khutbah&rdquo; to add the first prayer service.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-[#181a20] border border-[#2e323b] rounded-xl shadow-sm">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-[#2e323b] text-xs font-medium uppercase tracking-wider text-neutral-400">
            <th className="py-3 px-3 w-16 text-center">Order</th>
            <th className="py-3 px-3 w-28">Shift</th>
            <th className="py-3 px-4">Khutbah Time</th>
            <th className="py-3 px-4">Salah Time</th>
            <th className="py-3 px-4">Khateeb / Speaker</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2e323b] text-xs">
          {shifts.map((shift, index) => {
            const isDragging = draggedIndex === index;
            const isOver = dragOverIndex === index;

            return (
              <tr
                key={shift.id}
                draggable
                onDragStart={(e) => onDragStart(e, index)}
                onDragOver={(e) => onDragOver(e, index)}
                onDrop={(e) => onDrop(e, index)}
                onDragEnd={onDragEnd}
                className={`hover:bg-[#282a35]/40 transition-colors ${
                  isDragging ? 'opacity-30 bg-[#15161b]' : ''
                } ${isOver ? 'border-t-2 border-[#388bfd]' : ''}`}
              >
                {/* Reorder Grip & Arrows */}
                <td className="py-3 px-2 text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <span
                      className="cursor-grab active:cursor-grabbing text-neutral-500 hover:text-neutral-200 p-1 rounded hover:bg-[#282a35] transition-colors"
                      title="Drag up or down to reorder"
                    >
                      <GripVertical className="w-4 h-4" />
                    </span>
                    <div className="flex flex-col -space-y-0.5">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => onMoveShift(index, -1)}
                        className="text-neutral-500 hover:text-white disabled:opacity-20 p-0.5 active:scale-90 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed"
                        title="Move Shift Up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === shifts.length - 1}
                        onClick={() => onMoveShift(index, 1)}
                        className="text-neutral-500 hover:text-white disabled:opacity-20 p-0.5 active:scale-90 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed"
                        title="Move Shift Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </td>

                {/* Shift Label */}
                <td className="py-3 px-3">
                  <span className="font-semibold text-white text-xs tabular-nums">
                    Shift {index + 1}
                  </span>
                </td>

                {/* Khutbah Time */}
                <td className="py-3 px-4">
                  <div className="flex items-baseline space-x-1.5">
                    <span className="font-mono tabular-nums text-white font-bold text-sm">
                      {format12h(shift.adhan_time)}
                    </span>
                    <span className="font-mono tabular-nums text-neutral-500 text-[11px]">
                      ({shift.adhan_time})
                    </span>
                  </div>
                </td>

                {/* Salah Time */}
                <td className="py-3 px-4">
                  {shift.iqamah_time?.trim() ? (
                    <div className="flex items-baseline space-x-1.5">
                      <span className="font-mono tabular-nums text-[#3fb950] font-bold text-sm">
                        {format12h(shift.iqamah_time)}
                      </span>
                      <span className="font-mono tabular-nums text-neutral-500 text-[11px]">
                        ({shift.iqamah_time})
                      </span>
                    </div>
                  ) : (
                    <span className="text-neutral-500 italic text-xs">— (None)</span>
                  )}
                </td>

                {/* Khateeb / Speaker */}
                <td className="py-3 px-4">
                  {shift.khateeb_name?.trim() ? (
                    <span className="text-white font-medium text-xs">
                      {shift.khateeb_name}
                    </span>
                  ) : (
                    <span className="text-neutral-500 italic text-xs">
                      Optional (Not specified)
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end space-x-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenEditShift(shift)}
                      aria-label={`Edit Jummah shift ${shift.shift_number}`}
                      className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-[#282a35] active:scale-95 cursor-pointer transition-colors duration-150"
                      title="Edit Shift"
                    >
                      <Pencil className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteShift(shift.id)}
                      aria-label={`Delete Jummah shift ${shift.shift_number}`}
                      className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 active:scale-95 cursor-pointer transition-colors duration-150"
                      title="Remove Shift"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
