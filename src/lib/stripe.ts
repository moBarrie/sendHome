import Stripe from 'stripe';
import { env } from '@/env.mjs';

if (!env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Use the latest version
  typescript: true,
});
