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
import { format12h, timeToMinutes } from '@/lib/utils/time';
import { getShiftEndMinutes } from '@/lib/prayer/jummah-validation';

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
            Weekly Repeating Friday Jummah Schedule
          </h3>
          <p className="text-[11px] text-[var(--admin-text-muted)] mt-0.5">
            Sets your recurring every-Friday Khutbah &amp; Salah times. Automatically replaces Dhuhr on Fridays.
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

      {/* Mobile Stacked Khutbah Cards (< 768px) */}
      <div className="md:hidden divide-y divide-[var(--admin-border)]">
        {shifts.map((shift, index) => {
          const prev = index > 0 ? shifts[index - 1] : undefined;
          const prevEndMins = prev ? getShiftEndMinutes(prev) : null;
          const currStartMins = timeToMinutes(shift.adhan_time);
          const bufferMins = prevEndMins !== null ? currStartMins - prevEndMins : null;

          return (
            <React.Fragment key={shift.id}>
              {bufferMins !== null && (
                <div className="bg-[var(--admin-surface)]/40 text-[10px] font-mono py-2 px-4 flex items-center space-x-2">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${bufferMins >= 10 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className={bufferMins >= 10 ? 'text-[var(--admin-text-muted)]' : 'text-amber-500 font-semibold'}>
                    {bufferMins >= 0
                      ? `${bufferMins} min turnover buffer between Khutbah ${index} & ${index + 1}`
                      : `COLLISION: Starts ${Math.abs(bufferMins)}m before Khutbah ${index} ends!`}
                  </span>
                </div>
              )}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="flex flex-col gap-1">
                      <button type="button" disabled={index === 0} onClick={() => onMoveShift(index, -1)} className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed" aria-label={`Move Khutbah ${index + 1} up`}>
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" disabled={index === shifts.length - 1} onClick={() => onMoveShift(index, 1)} className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed" aria-label={`Move Khutbah ${index + 1} down`}>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[var(--admin-text-primary)]">Khutbah {index + 1}</div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        {shift.location?.trim() && (
                          <span className="px-1.5 py-0.5 rounded bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[10px] text-[var(--admin-text-muted)] font-medium">
                            {shift.location}
                          </span>
                        )}
                        {shift.language?.trim() && (
                          <span className="px-1.5 py-0.5 rounded bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[10px] text-[var(--admin-text-muted)] font-medium">
                            {shift.language}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button type="button" onClick={() => onOpenEdit(shift)} className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-surface)] active:scale-95 cursor-pointer transition" aria-label={`Edit Khutbah ${index + 1}`}>
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => onRequestDelete(shift.id)} className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[var(--admin-text-muted)] hover:text-rose-500 hover:bg-rose-500/10 active:scale-95 cursor-pointer transition" aria-label={`Delete Khutbah ${index + 1}`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)]">
                    <span className="text-[10px] text-[var(--admin-text-muted)] block">Khutbah Time</span>
                    <span className="font-mono font-bold text-[var(--admin-text-primary)]">{format12h(shift.adhan_time)}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)]">
                    <span className="text-[10px] text-[var(--admin-text-muted)] block">Salah Time</span>
                    <span className="font-mono font-bold text-[var(--admin-text-primary)]">{shift.iqamah_time ? format12h(shift.iqamah_time) : '—'}</span>
                  </div>
                </div>

                <div className="text-xs text-[var(--admin-text-primary)]">
                  <span className="text-[var(--admin-text-muted)]">Khateeb: </span>
                  {shift.khateeb_name?.trim() ? <span className="font-semibold">{shift.khateeb_name}</span> : <span className="text-[var(--admin-text-muted)] italic">To be announced</span>}
                  {shift.topic?.trim() && <div className="text-[11px] text-[var(--admin-text-muted)] italic mt-0.5">Topic: {shift.topic}</div>}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Desktop Jummah Table (>= 768px) */}
      <div className="hidden md:block overflow-x-auto">
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
            {shifts.map((shift, index) => {
              const prev = index > 0 ? shifts[index - 1] : undefined;
              const prevEndMins = prev ? getShiftEndMinutes(prev) : null;
              const currStartMins = timeToMinutes(shift.adhan_time);
              const bufferMins = prevEndMins !== null ? currStartMins - prevEndMins : null;

              return (
                <React.Fragment key={shift.id}>
                  {bufferMins !== null && (
                    <tr className="bg-[var(--admin-surface)]/40 text-[10px] font-mono border-t border-b border-[var(--admin-border)]">
                      <td colSpan={6} className="py-1.5 px-4">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              bufferMins >= 10 ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          />
                          <span className={bufferMins >= 10 ? 'text-[var(--admin-text-muted)]' : 'text-amber-500 font-semibold'}>
                            {bufferMins >= 0
                              ? `${bufferMins} min turnover buffer between Khutbah ${index} and Khutbah ${index + 1}`
                              : `COLLISION: Starts ${Math.abs(bufferMins)} min before Khutbah ${index} concludes prayer!`}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr
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
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-sm text-[var(--admin-text-primary)]">
                        Khutbah {index + 1}
                      </div>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        {shift.location?.trim() && (
                          <span className="px-1.5 py-0.2 rounded bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[9px] text-[var(--admin-text-muted)] font-medium">
                            {shift.location}
                          </span>
                        )}
                        {shift.language?.trim() && (
                          <span className="px-1.5 py-0.2 rounded bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[9px] text-[var(--admin-text-muted)] font-medium">
                            {shift.language}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-xs tabular-nums text-[var(--admin-text-secondary)]">{format12h(shift.adhan_time)}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-xs tabular-nums text-[var(--admin-text-secondary)]">{shift.iqamah_time ? format12h(shift.iqamah_time) : '—'}</td>
                    <td className="py-3.5 px-4 text-xs text-[var(--admin-text-primary)]">
                      <div>{shift.khateeb_name?.trim() ? shift.khateeb_name : <span className="text-[var(--admin-text-muted)] italic">To be announced</span>}</div>
                      {shift.topic?.trim() && (
                        <div className="text-[11px] text-[var(--admin-text-muted)] italic mt-0.5">
                          Topic: {shift.topic}
                        </div>
                      )}
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
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

