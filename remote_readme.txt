# Taxi LogicMoov ΓÇö Modern Taxi Platform (Web)

A modern, bilingual (Fran├ºais / English) taxi transportation platform website for Quebec, Canada. This is the customer-facing web app: marketing site + online booking flow.

Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, and **lucide-react** icons.

## Features

- **Bilingual** (FR default in Quebec, EN) via `[locale]` routing + language switcher. Locale is auto-detected from the browser's `Accept-Language` header.
- **Marketing home page**: hero with live price estimate, services, how-it-works, fleet, features, coverage, testimonials, CTA.
- **Multi-step booking flow** (`/[locale]/book`): trip ΓåÆ vehicle ΓåÆ contact details ΓåÆ confirmation. Submits to the backend API (`POST /bookings` + mock payment) with graceful error handling.
- **Admin dashboard** (`/[locale]/admin`): JWT login, overview stats, bookings management (with status transitions) and drivers list ΓÇö consumes the backend API.
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

Open http://localhost:3000 ΓÇö you'll be redirected to `/fr` or `/en` based on your browser language.

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
Γö£ΓöÇ app/
Γöé  ΓööΓöÇ [locale]/              # Locale-scoped routes; root layout sets <html lang>
Γöé     Γö£ΓöÇ layout.tsx          # html/body + locale validation
Γöé     Γö£ΓöÇ (site)/             # Public marketing group (shares Header + Footer)
Γöé     Γöé  Γö£ΓöÇ layout.tsx        # Header + Footer
Γöé     Γöé  Γö£ΓöÇ page.tsx          # Home
Γöé     Γöé  Γö£ΓöÇ book/             # Booking flow (wired to the API)
Γöé     Γöé  Γö£ΓöÇ about/
Γöé     Γöé  ΓööΓöÇ contact/
Γöé     ΓööΓöÇ admin/              # Admin dashboard (own shell, JWT-guarded)
Γöé        Γö£ΓöÇ layout.tsx        # AdminShell (sidebar + auth guard)
Γöé        Γö£ΓöÇ page.tsx          # Overview
Γöé        Γö£ΓöÇ bookings/         # Manage bookings
Γöé        Γö£ΓöÇ drivers/          # Drivers list
Γöé        ΓööΓöÇ login/            # Admin sign in
Γö£ΓöÇ components/               # Header, Footer, BookingForm, admin/*, ...
Γö£ΓöÇ i18n/                     # config.ts (locales) + dictionaries.ts (FR/EN)
Γö£ΓöÇ lib/
Γöé  Γö£ΓöÇ api.ts                 # Typed backend API client
Γöé  Γö£ΓöÇ adminAuth.ts           # Admin token/session helpers
Γöé  ΓööΓöÇ pricing.ts             # Mock fixed-price estimator
ΓööΓöÇ proxy.ts                  # Locale detection & redirect (Next 16 proxy)
```

## Admin dashboard

Visit `/[locale]/admin` (e.g. http://localhost:3000/en/admin). You'll be redirected
to the login page. Use the seeded admin credentials from the backend:

- **Email:** `admin@logicmoov.ca`
- **Password:** `LogicMoov@786`

Requires the backend API + a seeded database.

## Mock integrations

Maps distance and payment are **mocked** for now:

- `src/lib/pricing.ts` derives a deterministic mock distance from the address text. Replace `mockDistanceKm` with a real Google Maps Distance Matrix call.
- The booking confirmation generates a reference number but does **not** process payment or dispatch a driver.

## Roadmap (from the platform architecture)

This web app is the first piece of a larger platform. Planned services (API gateway, auth, booking, pricing, dispatch AI, payments, tracking, notifications, fleet management, analytics, Booking.com / Google Maps / flight-tracking connectors) can grow alongside this app in the same repository.
