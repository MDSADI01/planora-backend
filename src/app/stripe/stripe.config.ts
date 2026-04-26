import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const getStripe = () => {
  if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
  }

  return new Stripe(stripeSecretKey, {
    apiVersion: "2026-03-25.dahlia",
  });
};

export const getStripeWebhookSecret = () => {
  if (!stripeWebhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not defined in environment variables");
  }

  return stripeWebhookSecret;
};
