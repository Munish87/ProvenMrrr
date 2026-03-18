# ProvenMRR

**The marketplace for verified SaaS revenue.**

ProvenMRR lets founders connect Stripe, verify their MRR, and get an AI Health Score. Buyers and investors can discover real startups with transparent metrics, make offers, and find co-founders.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org) (App Router)
- **Database**: [Supabase](https://supabase.com) (Postgres + RLS + Edge Functions)
- **Payments**: [Stripe](https://stripe.com) (Checkout + Webhooks)
- **Email**: [Resend](https://resend.com) via Supabase Edge Function relay
- **Styling**: Vanilla CSS (global design system in `app/globals.css`)

## Getting Started

Copy the environment template and fill in your secrets:

```bash
cp .env.local.example .env.local
```

Then run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables

See `.env.local.example` for all required variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |
| `ENCRYPTION_KEY` | 32-byte AES-256-GCM key (hex) for encrypting Stripe API keys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_APP_URL` | Production domain (e.g. `https://provenmrr.com`) |
| `CRON_SECRET` | Secret for authorizing cron-triggered API routes |

## Deployment

Deploy on [Vercel](https://vercel.com). Set all environment variables in the Vercel dashboard. Make sure to register your production Stripe webhook endpoint pointing to:

```
https://provenmrr.com/api/webhooks/stripe
```
"# ProvenMrrr" 
