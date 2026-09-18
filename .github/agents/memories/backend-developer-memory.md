# Backend Developer Memory

## API Endpoints

### Public
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/products | List products (pagination, filters) |
| GET | /api/products/:slug | Get product by slug |
| GET | /api/categories | List categories |
| GET | /api/categories/:slug | Get category with products |
| GET | /api/reviews/product/:id | Get reviews for product |
| POST | /api/orders | Create order (COD) |
| GET | /api/orders/track/:orderNumber | Track order by number |
| GET | /api/faq | List FAQs |
| GET | /api/cms/:slug | Get CMS content section |
| GET | /api/settings | Get site settings |

### Protected (JWT)
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/login | Admin login |
| GET/POST/PUT/DELETE | /api/products/* | Product CRUD |
| GET/POST/PUT/DELETE | /api/categories/* | Category CRUD |
| GET/PUT | /api/orders/* | Order management |
| GET/POST/DELETE | /api/reviews/* | Review management |
| GET/POST/PUT/DELETE | /api/faq/* | FAQ CRUD |
| GET/POST/PUT | /api/cms/* | CMS CRUD |
| PUT | /api/settings | Update settings |
| POST | /api/upload/image | Upload file |

## Database Schema Notes

- **Product**: name, slug, description, price, comparePrice, images (JSON array), sizes (JSON array), category relation, stock, featured, active
- **Order**: orderNumber (HG-XXXXXXXX), customer fields, items relation, total, status (pending/confirmed/shipped/delivered/cancelled)
- **OrderItem**: productId, variantId, quantity, price, productName, productImage — price always set server-side

## Validation Notes

- Global ValidationPipe: `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`
- `@Type(() => Number)` required for numeric DTO fields that come as strings from form data
- Server ALWAYS uses its own product prices, never trusts client-submitted prices

## Known Patterns

- Seed service runs on first boot — creates categories, products, admin, settings, CMS content
- Admin password hashed with bcrypt
- JWT secret from config service
- File uploads stored in `backend/uploads/{type}/`
- Static files served via `ServeStaticModule` at `/uploads/`

## Security Checklist

- [x] Prices verified server-side
- [x] DTO whitelist prevents injection
- [x] JWT auth on admin routes
- [x] Password hashing (bcrypt)
- [ ] Rate limiting (not yet implemented)
- [ ] Input sanitization for CMS content (XSS risk from react-quill)
