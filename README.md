# TAXIMOVQC — Modern Taxi Platform (Web)

A modern, bilingual (Français / English) taxi transportation platform website for Quebec, Canada. This is the customer-facing web app: marketing site + online booking flow.

Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, and **lucide-react** icons.

## Features

- **Bilingual** (FR default in Quebec, EN) via `[locale]` routing + language switcher. Locale is auto-detected from the browser's `Accept-Language` header.
- **Marketing home page**: hero with live price estimate, services, how-it-works, fleet, features, coverage, testimonials, CTA.
- **Multi-step booking flow** (`/[locale]/book`): trip → vehicle → contact details → confirmation. Submits to the backend API (`POST /bookings` + mock payment) with graceful error handling.
- **Admin dashboard** (`/[locale]/admin`): JWT login, overview stats, bookings management (with status transitions) and drivers list — consumes the backend API.
- **Live chat support** (floating widget on every public page): an AI assistant answers instantly and customers can hand off to a **live human agent**. Agents reply in real time from the admin **Support** console (`/[locale]/admin/support`). Powered by Socket.IO.
- **About** and **Contact** pages (with a demo contact form).
- Fully responsive, accessible, and SEO-friendly (per-locale metadata).

## Configuration

Set the backend API base URL in `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

The backend lives in [`../api`](../api). Start it (and PostgreSQL) for the booking
submission and admin dashboard to work end-to-end. The public marketing pages and
the hero price estimate work without the backend.

## Getting started

```powershell
cd web
npm install
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/fr` or `/en` based on your browser language.

## Scripts

| Command         | Description                       |
| --------------- | --------------------------------- |
| `npm run dev`   | Start the dev server              |
| `npm run build` | Production build                  |
| `npm run start` | Run the production build          |
| `npm run lint`  | Lint the codebase                 |

## Project structure

```
web/src/
├─ app/
│  └─ [locale]/              # Locale-scoped routes; root layout sets <html lang>
│     ├─ layout.tsx          # html/body + locale validation
│     ├─ (site)/             # Public marketing group (shares Header + Footer)
│     │  ├─ layout.tsx        # Header + Footer
│     │  ├─ page.tsx          # Home
│     │  ├─ book/             # Booking flow (wired to the API)
│     │  ├─ about/
│     │  └─ contact/
│     └─ admin/              # Admin dashboard (own shell, JWT-guarded)
│        ├─ layout.tsx        # AdminShell (sidebar + auth guard)
│        ├─ page.tsx          # Overview
│        ├─ bookings/         # Manage bookings
│        ├─ drivers/          # Drivers list
│        └─ login/            # Admin sign in
├─ components/               # Header, Footer, BookingForm, admin/*, ...
├─ i18n/                     # config.ts (locales) + dictionaries.ts (FR/EN)
├─ lib/
│  ├─ api.ts                 # Typed backend API client
│  ├─ adminAuth.ts           # Admin token/session helpers
│  └─ pricing.ts             # Mock fixed-price estimator
└─ proxy.ts                  # Locale detection & redirect (Next 16 proxy)
```

## Admin dashboard

Visit `/[locale]/admin` (e.g. http://localhost:3000/en/admin). You'll be redirected
to the login page. Use the seeded admin credentials from the backend:

- **Email:** `admin@taximovqc.ca`
- **Password:** `Admin1234!`

Requires the backend API + a seeded database.

## Mock integrations

Maps distance and payment are **mocked** for now:

- `src/lib/pricing.ts` derives a deterministic mock distance from the address text. Replace `mockDistanceKm` with a real Google Maps Distance Matrix call.
- The booking confirmation generates a reference number but does **not** process payment or dispatch a driver.

## Roadmap (from the platform architecture)

This web app is the first piece of a larger platform. Planned services (API gateway, auth, booking, pricing, dispatch AI, payments, tracking, notifications, fleet management, analytics, Booking.com / Google Maps / flight-tracking connectors) can grow alongside this app in the same repository.
