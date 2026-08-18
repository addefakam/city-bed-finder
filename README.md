# City Bed Finder - Guest App

Mobile-first web app for guests to check **real-time room availability** across all guest houses in the city.

## Why This Exists

Some guest house providers hide available rooms from guests, especially during city events, to exploit the situation. This app shows **real data directly from the management system** — providers cannot hide or manipulate availability.

## Features

- **No login required** — anyone can access immediately
- **City-wide search** — find available beds across all approved guest houses
- **Real-time data** — availability pulled directly from the GHMS database
- **Room details** — see room types, prices, amenities, floor, capacity
- **Filters & sort** — by room type, price, availability, name
- **One-tap SOS** — floating button calls police immediately (0913169652)
- **Report abuse** — submit a report if a provider hides rooms or refuses service
- **Mobile-optimized** — designed for phones, works as PWA

## Setup

1. Clone the repo
2. Copy `.env.example` to `.env` and set `DATABASE_URL` (same PostgreSQL as GHMS)
3. Run `npx prisma db push` to create the `GuestReport` table (other tables already exist)
4. Run `npm run build && npm start`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (same DB as main GHMS) |
| `POLICE_PHONE` | No | Police phone number (default: 0913169652) |

## Deployment (Vercel)

1. Create new Vercel project
2. Set `DATABASE_URL` environment variable to the same PostgreSQL database
3. Deploy — the app is auto-configured for standalone output

## API Endpoints

- `GET /api/availability` — City-wide room availability (public, no auth)
- `GET /api/providers/[id]` — Single provider details
- `POST /api/report` — Submit abuse report
