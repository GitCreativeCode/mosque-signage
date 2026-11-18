import React from 'react';
import { AlertTriangle, Info, Lightbulb } from 'lucide-react';
import type { FaqArticleSection } from '@/lib/faq/faq-types';
import { ImageLightbox } from './ImageLightbox';

export interface FaqArticleBodyProps {
  readonly sections: readonly FaqArticleSection[];
}

export function FaqArticleBody({ sections }: FaqArticleBodyProps) {
  return (
    <article className="space-y-8">
      {sections.map((section, idx) => (
        <section key={idx} className="space-y-4">
          {section.heading && (
            <h2 className="text-lg font-bold text-[var(--admin-text-primary)] tracking-tight pt-2 border-b border-[var(--admin-border)]/50 pb-2">
              {section.heading}
            </h2>
          )}

          {section.paragraphs.map((para, pIdx) => (
            <p key={pIdx} className="text-sm text-[var(--admin-text-secondary)] leading-relaxed">
              {para}
            </p>
          ))}

          {section.steps && section.steps.length > 0 && (
            <ol className="space-y-2.5 pt-1 pl-1">
              {section.steps.map((step, sIdx) => (
                <li key={sIdx} className="flex items-start space-x-3 text-sm text-[var(--admin-text-secondary)] leading-relaxed">
                  <span className="font-bold text-[var(--admin-text-primary)] font-mono shrink-0 select-none">
                    {sIdx + 1}.
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          )}

          {section.image && (
            <ImageLightbox
              src={section.image.src}
              alt={section.image.alt}
              caption={section.image.caption}
              width={section.image.width}
              height={section.image.height}
            />
          )}

          {section.callout && (
            <div
              role="note"
              className={`p-4 rounded-2xl border text-sm flex items-start space-x-3 my-4 ${
                section.callout.type === 'tip'
                  ? 'border-green-600/30 bg-green-600/5 text-green-800 dark:text-green-300'
                  : section.callout.type === 'warning'
                    ? 'border-amber-500/30 bg-amber-500/5 text-amber-800 dark:text-amber-300'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-[var(--admin-text-secondary)]'
              }`}
            >
              {section.callout.type === 'tip' ? (
                <Lightbulb className="w-4 h-4 text-green-700 dark:text-green-400 shrink-0 mt-0.5" />
              ) : section.callout.type === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              )}
              <p className="leading-relaxed text-xs sm:text-sm">{section.callout.text}</p>
            </div>
          )}
        </section>
      ))}
    </article>
  );
}

