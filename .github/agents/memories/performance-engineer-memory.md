# Performance Engineer Memory

## Baseline Metrics

- (Record Lighthouse/CWV scores here after measuring)

## Current Optimizations

### Implemented
- `unoptimized` flag on upload-served images (prevents optimizer 400s)
- Cart hydration deferred to client-side effect (prevents hydration mismatch)
- Tailwind CSS purging enabled in production build

### Pending
- [ ] Add `priority` to hero/above-the-fold images
- [ ] Dynamic import for react-quill (admin only)
- [ ] Proper `sizes` attribute on product images
- [ ] Review bundle size — check for unnecessary dependencies
- [ ] Consider ISR (Incremental Static Regeneration) for product/category pages
- [ ] nginx: add caching headers for static assets
- [ ] Compress uploaded images server-side

## Architecture Notes

- Frontend serves SSR pages via Next.js on port 3000
- Backend API on port 4000 (same machine, low latency)
- SQLite database (single file, no network overhead)
- nginx reverse proxy adds one hop but enables static file serving
- Images in `/uploads/` are not processed/optimized — served as-is

## Bundle Concerns

- react-quill is heavy — ensure it's only loaded on admin pages
- react-icons — verify tree-shaking works (import specific icons, not entire sets)
- Zustand is lightweight (~1KB) — no concern

## Performance Log

- (Record optimization changes and measured impact here)
