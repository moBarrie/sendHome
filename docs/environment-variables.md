# Environment Variables Guide

## Local Development

Add these variables to your `.env.local` file:

```bash
MONIME_API_KEY=your_monime_api_key_here
MONIME_WEBHOOK_SECRET=your_monime_webhook_secret_here
```

## Production (Vercel)

1. Go to your Vercel dashboard
2. Select your project
3. Go to "Settings" tab
4. Click on "Environment Variables"
5. Add the following variables:
   - Name: `MONIME_API_KEY`
     Value: Your Monime API key
   - Name: `MONIME_WEBHOOK_SECRET`
     Value: Your Monime webhook secret

## Getting the API Keys

1. Log in to your Monime dashboard
2. Go to Settings > API Keys
3. Generate a new API key if needed
4. For webhook secret:
   - Go to Settings > Webhooks
   - Create a new webhook endpoint
   - Use the provided webhook secret

## Important Notes

- Never commit your `.env.local` file to git
- Keep your API keys secure
- Different API keys should be used for development and production
- Rotate keys periodically for security

## Verifying Setup

You can verify your environment variables are working by:

1. Restarting your development server
2. Making a test API call
3. Checking the webhook endpoint
