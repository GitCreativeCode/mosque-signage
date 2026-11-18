'use client';

import React from 'react';
import { AlertCircle, ExternalLink, Mail, MessageSquarePlus } from 'lucide-react';

export interface HelpdeskSupportCardProps {
  readonly className?: string | undefined;
  readonly supportFormUrl?: string | undefined;
  readonly feedbackFormUrl?: string | undefined;
  readonly supportEmail?: string | undefined;
}

const DEFAULT_SUPPORT_FORM_URL =
  process.env['NEXT_PUBLIC_SUPPORT_FORM_URL'] || 'https://forms.gle/X8j99388AAWAKk3a8';

const DEFAULT_FEEDBACK_FORM_URL =
  process.env['NEXT_PUBLIC_FEEDBACK_FORM_URL'] || 'https://forms.gle/E7TBvvD6H8njMhn88';

const DEFAULT_SUPPORT_EMAIL = 'helpdesk.guidance@gmail.com';

/**
 * Compact Community Helpdesk & Feedback Banner
 * Low-profile, sleek horizontal card with direct action pill buttons.
 */
export function HelpdeskSupportCard({
  className = '',
  supportFormUrl = DEFAULT_SUPPORT_FORM_URL,
  feedbackFormUrl = DEFAULT_FEEDBACK_FORM_URL,
  supportEmail = DEFAULT_SUPPORT_EMAIL,
}: HelpdeskSupportCardProps) {
  return (
    <section
      aria-labelledby="helpdesk-support-title"
      className={`rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 transition-colors ${className}`}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Clean Heading & Subtitle */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
            <h3 id="helpdesk-support-title" className="text-sm font-bold text-[var(--admin-text-primary)]">
              Need Help or Have Feedback?
            </h3>
          </div>
          <p className="text-xs text-[var(--admin-text-secondary)] leading-relaxed">
            Report technical issues, suggest improvements, or reach out to our team directly.
          </p>
        </div>

        {/* Right: 3 Modern Action Pill Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={supportFormUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-[var(--admin-border)] bg-[var(--admin-card)] hover:border-rose-500/50 hover:bg-rose-500/10 text-[var(--admin-text-primary)] hover:text-rose-400 transition cursor-pointer shadow-xs active:scale-95"
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>Report a Problem</span>
            <ExternalLink className="w-3 h-3 opacity-60 ml-0.5" />
          </a>

          <a
            href={feedbackFormUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-[var(--admin-border)] bg-[var(--admin-card)] hover:border-amber-500/50 hover:bg-amber-500/10 text-[var(--admin-text-primary)] hover:text-amber-400 transition cursor-pointer shadow-xs active:scale-95"
          >
            <MessageSquarePlus className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Share Feedback</span>
            <ExternalLink className="w-3 h-3 opacity-60 ml-0.5" />
          </a>

          <a
            href={`mailto:${supportEmail}`}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-[var(--admin-border)] bg-[var(--admin-card)] hover:border-emerald-500/50 hover:bg-emerald-500/10 text-[var(--admin-text-primary)] hover:text-emerald-400 transition cursor-pointer shadow-xs active:scale-95"
          >
            <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Email Helpdesk</span>
          </a>
        </div>
      </div>
    </section>
  );
}
