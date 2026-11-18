'use client';

import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import type { DbJummahShiftRecord } from '@/lib/actions/jummah';
import { format12h } from '@/lib/utils/time';

export interface JummahScheduleEditorCardProps {
  readonly shifts: readonly DbJummahShiftRecord[];
  readonly draggedIndex: number | null;
  readonly dragOverIndex: number | null;
  readonly jummahSuccess: boolean;
  readonly shiftOrderError: string | null;
  readonly onOpenAdd: () => void;
  readonly onOpenEdit: (shift: DbJummahShiftRecord) => void;
  readonly onRequestDelete: (id: string) => void;
  readonly onMoveShift: (index: number, direction: -1 | 1) => void;
  readonly onDragStart: (e: React.DragEvent, index: number) => void;
  readonly onDragOver: (e: React.DragEvent, index: number) => void;
  readonly onDrop: (e: React.DragEvent, index: number) => void;
}

export function JummahScheduleEditorCard({
  shifts, draggedIndex, dragOverIndex, jummahSuccess, shiftOrderError,
  onOpenAdd, onOpenEdit, onRequestDelete, onMoveShift, onDragStart, onDragOver, onDrop,
}: JummahScheduleEditorCardProps) {
  return (
    <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] overflow-hidden shadow-sm">
      <div className="p-4 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">
            Friday Jummah Khutbah Schedule
          </h3>
          <p className="text-[11px] text-[var(--admin-text-muted)] mt-0.5">
            Drag rows or use arrows to reorder. Khutbahs automatically replace standard Dhuhr display on Fridays.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {jummahSuccess && (
            <span className="text-xs font-semibold text-emerald-500 flex items-center space-x-1 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4" />
              <span>Jummah Khutbahs updated live!</span>
            </span>
          )}
          <button
            type="button"
            onClick={onOpenAdd}
            className="px-4 py-1.5 rounded-xl bg-[var(--admin-btn-primary-bg)] hover:bg-[var(--admin-btn-primary-hover)] text-[var(--admin-btn-primary-text)] font-semibold text-xs flex items-center space-x-1.5 transition active:scale-95 cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Khutbah</span>
          </button>
        </div>
      </div>

      {shiftOrderError && (
        <div className="m-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center space-x-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{shiftOrderError}</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--admin-border)] text-xs font-semibold text-[var(--admin-text-muted)] uppercase tracking-wider bg-[var(--admin-surface)]/50">
              <th className="py-3 px-3 w-28 text-center">Order</th>
              <th className="py-3 px-4">Khutbah</th>
              <th className="py-3 px-4">Khutbah Time</th>
              <th className="py-3 px-4">Salah Time</th>
              <th className="py-3 px-4">Khateeb / Speaker</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--admin-border)] text-xs text-[var(--admin-text-primary)]">
            {shifts.map((shift, index) => (
              <tr
                key={shift.id}
                draggable
                onDragStart={(e) => onDragStart(e, index)}
                onDragOver={(e) => onDragOver(e, index)}
                onDrop={(e) => onDrop(e, index)}
                className={`hover:bg-[var(--admin-surface)]/60 transition-colors ${
                  draggedIndex === index ? 'opacity-30' : ''
                } ${dragOverIndex === index ? 'border-t-2 border-[var(--admin-tab-active-border)]' : ''}`}
              >
                <td className="py-3.5 px-3 text-center">
                  <div className="flex items-center justify-center space-x-1.5 font-mono">
                    <span className="cursor-grab active:cursor-grabbing text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] p-0.5 rounded hover:bg-[var(--admin-surface)]" title="Drag to reorder">
                      <GripVertical className="w-4 h-4" />
                    </span>
                    <div className="flex flex-col -space-y-0.5">
                      <button type="button" disabled={index === 0} onClick={() => onMoveShift(index, -1)} className="p-0.5 text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed" title="Move Khutbah Up">
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" disabled={index === shifts.length - 1} onClick={() => onMoveShift(index, 1)} className="p-0.5 text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed" title="Move Khutbah Down">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-xs font-semibold tabular-nums text-[var(--admin-text-muted)] w-4 text-center">{index + 1}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 font-bold text-sm">Khutbah {index + 1}</td>
                <td className="py-3.5 px-4 font-mono font-semibold text-xs tabular-nums text-[var(--admin-text-secondary)]">{format12h(shift.adhan_time)}</td>
                <td className="py-3.5 px-4 font-mono font-semibold text-xs tabular-nums text-[var(--admin-text-secondary)]">{shift.iqamah_time ? format12h(shift.iqamah_time) : '—'}</td>
                <td className="py-3.5 px-4 text-xs text-[var(--admin-text-primary)]">
                  {shift.khateeb_name?.trim() ? shift.khateeb_name : <span className="text-[var(--admin-text-muted)] italic">To be announced</span>}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end space-x-1">
                    <button type="button" onClick={() => onOpenEdit(shift)} className="p-1.5 rounded-lg text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-surface)] active:scale-95 cursor-pointer transition" title="Edit shift details">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => onRequestDelete(shift.id)} className="p-1.5 rounded-lg text-[var(--admin-text-muted)] hover:text-rose-500 hover:bg-rose-500/10 active:scale-95 cursor-pointer transition" title="Delete shift">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

