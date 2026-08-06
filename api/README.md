# TAXIMOVQC — Backend API

REST API for the TAXIMOVQC taxi platform: authentication, pricing, bookings, drivers, vehicles and payments.

Built with **Node.js + TypeScript + Express + Prisma + PostgreSQL**, with optional **Redis** caching and **JWT** auth. The code is organized into domain modules (`src/modules/*`) that map to the platform architecture and can later be split into independent microservices.

## Prerequisites

- Node.js 20+
- PostgreSQL 14+ (a `docker-compose.yml` is provided)
- Redis (optional)

## Quick start

```powershell
cd api
npm install
Copy-Item .env.example .env   # then edit secrets

# Start Postgres + Redis (requires Docker)
docker compose up -d

# Create the schema and seed sample data
npx prisma migrate dev --name init
npm run db:seed

# Run the API
npm run dev        # http://localhost:4000
```

If you don't have Docker, point `DATABASE_URL` in `.env` at any PostgreSQL instance.

Important env vars for production:
- `CORS_ORIGINS` must include your web app domains (for example `https://logicmoov.ca,https://www.logicmoov.ca`).
- `GOOGLE_MAPS_API_KEY` is required for `/api/v1/location/search`.

## Scripts

| Command                   | Description                                  |
| ------------------------- | -------------------------------------------- |
| `npm run dev`             | Start dev server (watch mode)                |
| `npm run build`           | Compile TypeScript to `dist/`                |
| `npm run start`           | Run the compiled server                      |
| `npm run typecheck`       | Type-check without emitting                  |
| `npm run prisma:migrate`  | Create/apply a dev migration                 |
| `npm run db:seed`         | Seed pricing rules, an admin and a driver    |
| `npm run prisma:studio`   | Open Prisma Studio                           |

## Seeded accounts

| Role   | Email                     | Password       |
| ------ | ------------------------- | -------------- |
| Admin  | `admin@taximovqc.ca`     | `Admin1234!`   |
| Driver | `driver@taximovqc.ca`    | `Driver1234!`  |
| Agent  | `agent@taximovqc.ca`     | `Agent1234!`   |

## API overview

Base URL: `http://localhost:4000/api/v1`

### City taxi fare formula

`Total Fare = Base Fare + (Distance × Rate per km) + (Waiting Time × Waiting Rate) + Booking Fee + Extra Charges`

The backend stores city fare settings in `FareRule` (`fare_rules`) and uses them for `/pricing/city-quote`.

### Auth
| Method | Path              | Auth | Description                        |
| ------ | ----------------- | ---- | ---------------------------------- |
| POST   | `/auth/register`  | —    | Register (CUSTOMER or DRIVER)      |
| POST   | `/auth/login`     | —    | Login, returns access + refresh    |
| POST   | `/auth/refresh`   | —    | Rotate refresh token               |
| POST   | `/auth/logout`    | —    | Revoke a refresh token             |
| GET    | `/auth/me`        | ✅   | Current user profile               |

### Pricing
| Method | Path               | Auth | Description                                    |
| ------ | ------------------ | ---- | ---------------------------------------------- |
| POST   | `/pricing/quote`   | —    | Quote by `distanceKm` or `pickup`+`dropoff`    |
| GET    | `/pricing/rules`   | —    | List pricing rules                             |
| GET    | `/pricing/fare-rules` | — | List active city fare rules (`fare_rules`)     |
| PUT    | `/pricing/fare-rules` | ADMIN | Create/update city fare rules                  |
| PATCH  | `/pricing/fare-rules/:id/active` | ADMIN | Activate/deactivate fare rule       |
| DELETE | `/pricing/fare-rules/:id` | ADMIN | Delete fare rule                               |
| POST   | `/pricing/city-quote` | — | Calculate city fare from DB rule + formula     |

### Bookings
| Method | Path                       | Auth        | Description                        |
| ------ | -------------------------- | ----------- | ---------------------------------- |
| POST   | `/bookings`                | optional    | Create a booking (guest or user)   |
| GET    | `/bookings`                | ✅          | List own bookings (admin: all)     |
| GET    | `/bookings/:reference`     | —           | Look up a booking by reference     |
| PATCH  | `/bookings/:id/status`     | ADMIN/DRIVER| Update booking status              |

### Drivers / Vehicles / Payments
| Method | Path                          | Auth         | Description                    |
| ------ | ----------------------------- | ------------ | ------------------------------ |
| GET    | `/drivers`                    | ADMIN        | List drivers                   |
| POST   | `/drivers`                    | ADMIN        | Create a driver profile        |
| PATCH  | `/drivers/:id/status`         | DRIVER/ADMIN | Set availability               |
| PATCH  | `/drivers/:id/location`       | DRIVER/ADMIN | Push GPS location              |
| GET    | `/vehicles`                   | —            | List active vehicles           |
| POST   | `/vehicles`                   | ADMIN        | Add a vehicle                  |
| POST   | `/payments/:reference/pay`    | optional     | Mock payment (marks PAID)      |
| GET    | `/payments/:reference`        | —            | Payment status                 |

### Support / Chat
Real-time via **Socket.IO** (same origin). Customers use the conversation `id` as an access key; agents authenticate as ADMIN/AGENT.

| Method | Path                                          | Auth        | Description                          |
| ------ | --------------------------------------------- | ----------- | ------------------------------------ |
| POST   | `/support/conversations`                      | optional    | Start a chat (triggers AI reply)     |
| GET    | `/support/conversations/:id`                  | —           | Fetch a conversation + messages      |
| POST   | `/support/conversations/:id/messages`         | —           | Customer sends a message             |
| POST   | `/support/conversations/:id/handoff`          | —           | Request a human agent                |
| GET    | `/support/agent/conversations`                | ADMIN/AGENT | List conversations (filter `status`) |
| POST   | `/support/agent/conversations/:id/claim`      | ADMIN/AGENT | Claim a conversation                 |
| POST   | `/support/agent/conversations/:id/messages`   | ADMIN/AGENT | Agent replies                        |
| POST   | `/support/agent/conversations/:id/resolve`    | ADMIN/AGENT | Mark resolved                        |

The AI assistant is **rule-based** by default and bilingual (FR/EN). Set `OPENAI_API_KEY`
(and optionally `OPENAI_MODEL`) to use an LLM instead — it falls back to rules on error.

Socket.IO events: clients emit `conversation:join` / `conversation:leave`; agents emit
`agents:join`. The server emits `message`, `conversation` (status) and `queue:*` events.

### Example: create a booking

```bash
curl -X POST http://localhost:4000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "category": "SEDAN",
    "tripType": "ONE_WAY",
    "pickupAddress": "1000 De la Gauchetière, Montreal",
    "dropoffAddress": "Montreal-Trudeau Airport (YUL)",
    "scheduledAt": "2026-08-01T09:30:00.000Z",
    "passengers": 2,
    "contactName": "Marie L.",
    "contactEmail": "marie@example.com",
    "contactPhone": "5145550123"
  }'
```

## Data model

See [prisma/schema.prisma](prisma/schema.prisma): `User`, `RefreshToken`, `DriverProfile`, `Vehicle`, `PricingRule`, `Booking`, `Payment`, `TrackingEvent`.

## Mock integrations

- **Distance/Maps** — `mockDistanceKm` derives a deterministic distance from address text. Swap for Google Maps Distance Matrix.
- **Payments** — `/payments/:reference/pay` marks the payment PAID without a real processor. Swap for Stripe PaymentIntents + webhooks.
