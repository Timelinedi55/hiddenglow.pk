# Project Manager Memory

## Project History

### Phase 1 — Production Launch Fixes (Completed)
- **Image 400 errors**: Fixed `MediaImage.tsx` to add `unoptimized={true}` for `/uploads/` paths (Next.js Image optimizer can't access nginx-served uploads)
- **Checkout 400 errors**: Fixed Order DTO — added `@Type(() => Number)` decorators for numeric fields arriving as strings from frontend
- **React hydration errors (#418, #423)**: Refactored Zustand cart store to initialize empty, hydrate via client-only `CartHydrator` component in useEffect
- **All fixes verified**: Full QA sweep passed — Homepage, Shop, Category, Product, Cart, Checkout, Track Order, Content Pages, Admin

### Phase 2 — Branding & Conversion (Pending)
- User requested new color theme: Primary #E86A8A, Secondary #F4A6B5, Accent #C94A6A, Background #FFF6F8
- Product page needs conversion optimization ("not responsive and not high sales")
- User explicitly said: "DONT USE EMOJI icons use libraries base" — use react-icons

## Deployment Notes

- **Server**: 31.97.197.90
- **nginx**: Reverse proxy — `/api` → port 4000, `/uploads` → static files, everything else → port 3000
- **Frontend rebuild**: `cd /var/www/hiddenglow.pk/frontend && npx next build`
- **Backend rebuild**: `cd /var/www/hiddenglow.pk/backend && npx nest build`
- **Test orders placed**: HG-1C00F1FB, HG-9D65D1BC, HG-E1819D04

## Lessons Learned

- Next.js Image optimizer returns 400 for images it can't fetch internally (e.g., nginx-proxied paths)
- NestJS ValidationPipe with `transform: true` still needs `@Type()` decorators for proper type coercion
- Zustand persist middleware causes React hydration mismatches — defer localStorage reads to useEffect
- Always verify `.next` build output for hardcoded URLs after changing env vars

## Team Preferences

- No emoji in UI — use react-icons library
- Prices in PKR format: Rs. X,XXX
- Target market: Pakistan, women aged 20-45
- COD (Cash on Delivery) is the only payment method
