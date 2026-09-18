# QA Tester Memory

## Test History

### QA Run — Phase 1 Launch (Passed)
- **Homepage**: PASS — Loads, categories display, hero renders
- **Shop Page**: PASS — Products load with images, pagination works
- **Category Pages**: PASS — Filtered products display correctly
- **Product Pages**: PASS — Images, variants, add to cart all functional
- **Cart**: PASS — Items persist, quantities update, totals correct
- **Checkout**: PASS — Form validates, order submits, confirmation shows
- **Track Order**: PASS — Order number lookup returns correct data (tested: HG-E1819D04)
- **Content Pages**: PASS — About, FAQ, Contact, Privacy, Terms, Shipping, Returns all render
- **Admin Login**: PASS — Credentials work (admin@hiddenglow.pk)
- **Admin CRUD**: PASS — Categories and CMS pages load correctly

## Known Fixed Issues

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Image 400 errors | Next.js optimizer can't reach nginx uploads | `unoptimized={true}` on upload paths |
| Checkout 400 | DTO rejects string numbers | `@Type(() => Number)` decorators |
| Hydration #418/#423 | Cart store reads localStorage during SSR | Deferred hydration via CartHydrator |

## Regression Watchlist

- After color/branding changes: verify all buttons, links, and text are readable
- After product page changes: verify cart add, buy now, and sticky CTA all work
- After any media changes: verify images load across all page types
- After backend DTO changes: test checkout flow end-to-end

## Test Credentials

- Admin: admin@hiddenglow.pk / Admin@123
- Test phone: 03001234567
- Test city: Lahore
- Server: 31.97.197.90
