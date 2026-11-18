# FAQ Article Directory (`src/app/faq/[slug]/`)

## 1. Purpose
The `src/app/faq/[slug]/` directory renders individual deep-dive guides, hardware setup walk-throughs, liturgical calculation specifications, and troubleshooting articles with embedded diagrams.

---

## 2. Boundaries

### What Belongs Here
- Dynamic route `page.tsx` resolving individual `FaqItem` entities by slug.
- Step-by-step instructions, callouts, and lightbox diagrams.
- Related questions cross-linking cards.

### What Does NOT Belong Here
- Search scoring algorithms or registry data (belongs in `src/lib/faq/`).
- Kiosk display canvases (belongs in `src/app/display/`).

---

## 3. Export & Dependency Rules
- **Exports**: Default export `FaqArticlePage` and `generateStaticParams`.
- **Dependencies**: Imports from `@/lib/faq/faq-data`, `@/components/faq/ImageLightbox`, and `@/components/common/SiteFooter`.

