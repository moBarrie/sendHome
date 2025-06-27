# SendHome - Money Transfer Application

A modern Next.js application for sending money transfers to Sierra Leone with real-time exchange rates and secure payment processing.

## Features

- 🏦 Real-time GBP to SLE exchange rates via XE API
- 💳 Secure payments with Stripe
- 📱 Instant payouts via Monime API
- 🔐 KYC verification system
- 📊 Admin dashboard with transfer monitoring
- 💨 Real-time notifications
- 🎨 Modern, responsive UI

## Setup

### Environment Variables

Add the following to your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Monime API Configuration
MONIME_API_URL=https://api.monime.io/payouts
MONIME_API_KEY=your_monime_api_key
MONIME_SPACE_ID=your_monime_space_id
MONIME_WEBHOOK_SECRET=your_monime_webhook_secret

# XE API Configuration (for real-time exchange rates)
XE_ACCOUNT_API=your_xe_account_id
XE_API_KEY=your_xe_api_key
```

### XE API Setup

1. Sign up at [XE Currency Data API](https://www.xe.com/xecurrencydata/)
2. Get your Account ID and API Key
3. Add them to your `.env.local` file
4. The app will automatically fetch real-time GBP to SLE exchange rates
5. If XE API is not configured, the app will use a fallback rate of 28,000 SLE per GBP

**Note:** Demo/trial XE API accounts may return fixed test rates (like 1.2345 for all currency pairs). The app automatically detects this and uses realistic fallback rates to ensure proper functionality.

### Development

```bash
npm install
npm run dev
```

### Testing XE API Integration

```bash
node test-xe-api.js
```

## API Endpoints

- `GET /api/exchange-rate` - Fetch current GBP to SLE exchange rate
- `POST /api/create-payment-intent` - Create Stripe payment intent
- `POST /api/stripe-webhook` - Handle Stripe webhook events
- `POST /api/trigger-payout` - Manually trigger Monime payout
- `GET /api/test-monime-connection` - Test Monime API connection

## Admin Dashboard

Access the admin dashboard at `/admin/transfers` to monitor all transfers in real-time.

## Currency

The application uses **SLE (Sierra Leonean Leone)** as the recipient currency, which replaced SLL in 2022.
