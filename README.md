# Taxi LogicMoov â€” Modern Taxi Platform (Web)

A modern, bilingual (FranÃ§ais / English) taxi transportation platform website for Quebec, Canada. This is the customer-facing web app: marketing site + online booking flow.

Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, and **lucide-react** icons.

## Features

- **Bilingual** (FR default in Quebec, EN) via `[locale]` routing + language switcher. Locale is auto-detected from the browser's `Accept-Language` header.
- **Marketing home page**: hero with live price estimate, services, how-it-works, fleet, features, coverage, testimonials, CTA.
- **Multi-step booking flow** (`/[locale]/book`): trip â†’ passengers â†’ vehicle â†’ contact details â†’ confirmation. Uses live address suggestions and continues to Stripe checkout.
- **Admin dashboard** (`/[locale]/admin`): JWT login, overview stats, bookings management (with status transitions) and drivers list â€” consumes the backend API.
- **Live chat support** (floating widget on every public page): an AI assistant answers instantly and customers can hand off to a **live human agent**. Agents reply in real time from the admin **Support** console (`/[locale]/admin/support`). Powered by Socket.IO.
- **About** and **Contact** pages (with a demo contact form).
- Fully responsive, accessible, and SEO-friendly (per-locale metadata).

## Configuration

Set the backend API base URL in `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_browser_key
```

For the local fallback prototype, the app still works without the Supabase URL/key, but the real DB path requires both values above.

The backend lives in [`../api`](../api). Start it (and PostgreSQL) for the booking
submission and admin dashboard to work end-to-end. The public marketing pages and
the hero price estimate work without the backend.

## Getting started

```powershell
cd web
npm install
npm run dev
```

Open http://localhost:3000 â€” you'll be redirected to `/fr` or `/en` based on your browser language.

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
â”œâ”€ app/
â”‚  â””â”€ [locale]/              # Locale-scoped routes; root layout sets <html lang>
â”‚     â”œâ”€ layout.tsx          # html/body + locale validation
â”‚     â”œâ”€ (site)/             # Public marketing group (shares Header + Footer)
â”‚     â”‚  â”œâ”€ layout.tsx        # Header + Footer
â”‚     â”‚  â”œâ”€ page.tsx          # Home
â”‚     â”‚  â”œâ”€ book/             # Booking flow (wired to the API)
â”‚     â”‚  â”œâ”€ about/
â”‚     â”‚  â””â”€ contact/
â”‚     â””â”€ admin/              # Admin dashboard (own shell, JWT-guarded)
â”‚        â”œâ”€ layout.tsx        # AdminShell (sidebar + auth guard)
â”‚        â”œâ”€ page.tsx          # Overview
â”‚        â”œâ”€ bookings/         # Manage bookings
â”‚        â”œâ”€ drivers/          # Drivers list
â”‚        â””â”€ login/            # Admin sign in
â”œâ”€ components/               # Header, Footer, BookingForm, admin/*, ...
â”œâ”€ i18n/                     # config.ts (locales) + dictionaries.ts (FR/EN)
â”œâ”€ lib/
â”‚  â”œâ”€ api.ts                 # Typed backend API client
â”‚  â”œâ”€ adminAuth.ts           # Admin token/session helpers
â”‚  â””â”€ pricing.ts             # Mock fixed-price estimator
â””â”€ proxy.ts                  # Locale detection & redirect (Next 16 proxy)
```

## Admin dashboard

Visit `/[locale]/admin` (e.g. http://localhost:3000/en/admin). You'll be redirected
to the login page. Use the seeded admin credentials from the backend:

- **Email:** `admin@logicmoov.ca`
- **Password:** `Admin1234!`

Requires the backend API + a seeded database.

## Mock integrations

Maps distance and payment are **mocked** for now:

- `src/lib/pricing.ts` derives a deterministic mock distance from the address text. Replace `mockDistanceKm` with a real Google Maps Distance Matrix call.
- The booking confirmation generates a reference number but does **not** process payment or dispatch a driver.

## Roadmap (from the platform architecture)

This web app is the first piece of a larger platform. Planned services (API gateway, auth, booking, pricing, dispatch AI, payments, tracking, notifications, fleet management, analytics, Booking.com / Google Maps / flight-tracking connectors) can grow alongside this app in the same repository.

