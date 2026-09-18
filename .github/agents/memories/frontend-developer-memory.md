# Frontend Developer Memory

## Architecture Decisions

### Cart Hydration Pattern
- Zustand store initializes with empty `items: []` and `hasHydrated: false`
- `CartHydrator` component (in root layout) calls `hydrateFromStorage()` in useEffect
- Pages that depend on cart data check `hasHydrated` before rendering content
- This prevents React hydration mismatch errors (#418, #423)

### Image Handling
- `MediaImage` component wraps `next/image`
- For `/uploads/` paths: adds `unoptimized={true}` (optimizer can't reach nginx)
- Always use `getImageUrl()` from utils.ts to construct image URLs
- `UPLOADS_URL` from env: `/uploads` in production, `http://localhost:4000/uploads` in dev

### API Pattern
- `api.ts` exports `api` object with `get`, `post`, `put`, `delete`, `upload` methods
- Base URL: `/api` in production (nginx proxies to port 4000)
- Auth token stored in localStorage, sent as Bearer header

## Component Registry

| Component | Purpose | Client? |
|-----------|---------|---------|
| Header | Nav + categories dropdown + cart button | Yes |
| Footer | Site footer with links | No |
| CartDrawer | Slide-out cart sidebar | Yes |
| ProductCard | Product grid card | Yes (cart actions) |
| MediaImage | next/image wrapper | No |
| CartHydrator | Client-only cart init | Yes |
| PageHero | Page title banner | No |
| CmsTextPage | CMS content renderer | No |
| RichTextEditor | Quill wrapper (admin) | Yes (dynamic) |
| SiteScripts | Analytics/tracking | Yes |

## Key Files Modified

- `store.ts` — Refactored for SSR-safe hydration
- `MediaImage.tsx` — Added unoptimized for uploads
- `CartHydrator.tsx` — New component for hydration
- `layout.tsx` — Added CartHydrator
- `cart/page.tsx` — Added hasHydrated check
- `checkout/page.tsx` — Added hasHydrated check

## Development Notes

- Fonts: Inter (sans) + Playfair Display (serif) loaded in root layout
- Toast: react-hot-toast with Toaster in root layout
- No emoji icons — use react-icons (HiOutline*, Fi*, Bi*)
