# Hidden Glow

E-commerce platform for [hiddenglow.pk](https://hiddenglow.pk) — a Pakistani beauty and skincare
store. Cash on delivery, PKR pricing, a full admin back office, and a referral/partner programme.

Three services run side by side behind one nginx vhost:

| Service | Stack | Port | Directory |
|---|---|---|---|
| Storefront + admin | Next.js 14 (App Router), Tailwind, Zustand | 3001 | [frontend/](frontend/) |
| API | NestJS 10, TypeORM, MySQL, JWT | 4001 | [backend/](backend/) |
| ML insights | FastAPI, scikit-learn, pandas | 4002 | [ml-service/](ml-service/) |

nginx routes `/api/ml/*` to the ML service, `/api/*` to the NestJS API, `/uploads/*` straight off
disk, and everything else to Next.js. So the browser only ever talks to one origin.

---

## Quick start (local)

**Prerequisites:** Node.js 20+, Python 3.10+, and a running MySQL 8 server.

```bash
git clone https://github.com/Timelinedi55/hiddenglow.pk.git
cd hiddenglow.pk
```

**1. Create the database**

```sql
CREATE DATABASE hiddenglow_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'hiddenglow'@'localhost' IDENTIFIED BY 'choose_a_password';
GRANT ALL PRIVILEGES ON hiddenglow_db.* TO 'hiddenglow'@'localhost';
```

You do not need to create any tables. TypeORM runs with `synchronize: true`, so the schema is
built from the entities on first boot, and a seeder fills in demo categories, products, CMS pages
and FAQs.

**2. API**

```bash
cd backend
cp .env.example .env        # then set DATABASE_PASSWORD and JWT_SECRET
npm install
npm run start:dev           # http://localhost:4001/api
```

**3. Storefront**

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev                 # http://localhost:3000
```

**4. ML service** (optional — only the admin *ML Insights* page needs it)

```bash
cd ml-service
cp .env.example .env        # same database credentials as the backend
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
./venv/bin/python main.py   # http://localhost:4002
```

Admin panel: <http://localhost:3000/admin/login>, using the `ADMIN_DEFAULT_EMAIL` and
`ADMIN_DEFAULT_PASSWORD` from `backend/.env`. Those two values are only read on the very first
boot, when the admin table is empty; changing them later does nothing, so change the password from
inside the admin panel instead.

---

## Deploy to a VPS

Ubuntu 22.04 or 24.04, 2GB RAM minimum (the Next.js build is the memory-hungry step).

```bash
sudo mkdir -p /var/www && cd /var/www
sudo git clone https://github.com/Timelinedi55/hiddenglow.pk.git hiddenglow.pk
cd hiddenglow.pk
sudo bash deploy/setup.sh
```

[deploy/setup.sh](deploy/setup.sh) installs Node 20, MySQL, Python, nginx and PM2; creates the
database; generates a database password, JWT secret and admin password; writes the three `.env`
files; builds all three services; installs the nginx vhost; and starts everything under PM2 with a
boot-time startup hook. It prints the generated admin credentials at the end — save them.

It is safe to re-run. It never overwrites an existing `.env` and never drops data.

To deploy under a different domain or path, set the variables first:

```bash
sudo DOMAIN=example.com bash deploy/setup.sh
```

**Then point your DNS A record at the server and enable HTTPS:**

```bash
sudo certbot --nginx -d hiddenglow.pk -d www.hiddenglow.pk
```

Certbot rewrites the vhost in place to add the TLS listener and the HTTP→HTTPS redirect.

### Shipping changes afterwards

```bash
cd /var/www/hiddenglow.pk && bash deploy/update.sh
```

Pulls, reinstalls, rebuilds, then reloads PM2 — in that order, so a failed build leaves the running
site untouched.

### Operating it

```bash
pm2 status                    # all three services
pm2 logs hiddenglow-api       # tail one service
pm2 restart hiddenglow-web
sudo nginx -t && sudo systemctl reload nginx
curl -s localhost:4001/api/products | head -c 200   # is the API alive?
curl -s localhost:4002/api/ml/health                # is the ML service alive?
```

Logs are written to [logs/](logs/), which is not tracked in git.

---

## Environment variables

Each service reads its own file. All three are gitignored; copy the `.env.example` next to them.

**`backend/.env`**

| Variable | Purpose |
|---|---|
| `DATABASE_HOST` `DATABASE_PORT` `DATABASE_USER` `DATABASE_PASSWORD` `DATABASE_NAME` | MySQL connection |
| `JWT_SECRET` | Signs admin sessions. Generate with `openssl rand -base64 48` |
| `ADMIN_DEFAULT_EMAIL` `ADMIN_DEFAULT_PASSWORD` | Seeded on first boot only |
| `UPLOAD_DIR` | Where product images land, relative to `backend/` |
| `PORT` | API port (4001) |
| `FRONTEND_URL` | Allowed CORS origin(s), comma-separated |

**`frontend/.env.local`** (development) or **`frontend/.env.production.local`** (production)

| Variable | Development | Production |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4001/api` | `/api` |
| `NEXT_PUBLIC_UPLOADS_URL` | `http://localhost:4001/uploads` | `https://your-domain.com/uploads` |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | `https://your-domain.com` |

These are compiled into the client bundle, so **rerun `npm run build` after changing any of them** —
restarting alone will not pick them up.

**`ml-service/.env`** — the same MySQL credentials as the backend, plus `API_PORT` (4002).

---

## Repository layout

```
backend/          NestJS API
  src/modules/      products, orders, auth, cms, analytics, returns, referrals, …
  src/entities/     TypeORM entities (the schema is generated from these)
  src/seed/         first-boot demo data
  uploads/          product, category and settings images (tracked in git)
frontend/         Next.js storefront and admin
  src/app/(public)/ storefront: shop, product, cart, checkout, track-order
  src/app/admin/    back office: orders, products, inventory, analytics, SEO, CMS
  src/app/partner/  referral partner dashboard
  src/lib/          API client, Zustand store, shared types
ml-service/       FastAPI recommendations and insights
deploy/           nginx vhost, setup.sh, update.sh
.github/agents/   Copilot agent definitions used during development
ecosystem.config.js   PM2 process definitions for all three services
```

---

## Things worth knowing

- **`synchronize: true` is on.** TypeORM alters the live schema to match the entities on every
  boot. Convenient, but it means a careless entity edit can drop a column in production — back the
  database up before deploying entity changes.
- **Uploads live on disk, not in the database.** `backend/uploads/` is committed so a fresh clone
  has images, but anything uploaded through the admin panel afterwards exists only on that server.
  Include it in your backups.
- **The seeder only runs against empty tables**, so it will not clobber real data on redeploy.
- **Next.js image optimization is disabled for `/uploads/` paths** — the optimizer cannot fetch
  images that nginx serves off disk, and returns 400 if you let it try.
- Payment is cash on delivery only; there is no payment gateway integration to configure.
