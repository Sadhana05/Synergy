# Autopay Frontend (Local README)

This README covers the local frontend and mock API endpoints added for development and demo purposes.

## Quick start

Install dependencies and run the Next.js dev server:

```bash
pnpm install
pnpm dev
# or
npm install
npm run dev
```

Open http://localhost:3000 and navigate to the Balance and Analytics pages.

## Mock API routes

For development convenience several mock route handlers are provided under `app/api`:

- `GET /api/payments` - Returns paginated payments and supports query params: `search`/`q`, `method`, `from`, `to`, `page`, `limit`.
- `GET /api/analytics/*` - Catch-all analytics endpoints. `GET /api/analytics` returns a dashboard payload. Subpaths like `/api/analytics/revenue/hourly` return smaller datasets used by the analytics UI.
- `GET|POST|DELETE /api/recurring` - Manage mock recurring subscriptions. `POST` creates, `DELETE?id=sub_x` cancels.
- `GET|POST /api/customers` - Simple customer management endpoints.

These are mock implementations meant for frontend development/testing. Replace with real backend services when ready.

## Implemented frontend features

- Recent activity detail modal on `Balance` page
- Client-side search & filters (id/method/amount + date range)
- Export CSV & Print from filtered results
- Analytics dashboard (frontend) consuming mock API
- Mock endpoints for payments, analytics, recurring payments and customers

## Next steps

- Replace mock API with real backend endpoints or proxy to your existing API by setting `NEXT_PUBLIC_API_URL`.
- Add server-side pagination and authenticated routes.
- Add UI for refunds, disputes, scheduled reports and notifications.

If you want, I can: implement server-side search, add pagination UI, or wire the frontend to an external API. Let me know which to prioritize.
