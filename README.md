# Housing Finance Planner

A visual mortgage and home-finance planning application focused on showing the financial impact of major decisions, not just producing a single monthly-payment number.

## Planned phases
1. Calculation engine and baseline visual dashboard
2. Closing costs, points, lender credits, loan products, PMI logic and cash-to-close
3. One-time/custom extra payments, recast comparison and richer amortization views
4. Multi-scenario comparison and saved property workspaces
5. Supabase Auth and persistence across devices
6. Florida-specific ownership costs
7. Coolify deployment and production hardening

## Development

```bash
npm install
npm run dev
```

## Sign-in and saved scenarios (Supabase, free plan)

Logins and saved houses are stored in Supabase. The free plan is enough for this app.

1. Create a free project at https://supabase.com (or use your existing one).
2. In the Supabase dashboard open **SQL Editor -> New query**, paste everything from `supabase/schema.sql`, and click **Run**.
3. Open **Authentication -> URL Configuration** and set **Site URL** to `https://housefinance.ferdous.us`. Add the same address under **Redirect URLs** (needed for email confirmation and password reset links).
4. Open **Project Settings -> API** and copy the Project URL and the publishable (anon) key.
5. Put them in `.env.local` for local work (see `.env.example`), and in Coolify as build environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
6. Redeploy.

Passwords are kept by Supabase Auth, never in this app's tables. Row level security makes sure each user can only see their own houses.

## Favicon

Replace `public/favicon.svg` with your own icon (keep the same name, or update the `<link rel="icon">` line in `index.html`).

## Build

```bash
npm run build
```

This software is for planning and education. Final loan terms, insurance, taxes, fees, escrow requirements and closing amounts must be verified with the lender, insurer, taxing authority and closing documents.
