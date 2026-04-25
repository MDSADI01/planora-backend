#!/usr/bin/env -S npm run-script run

import Stripe from "stripe";
import express from "express";
import env from "dotenv";
import { AddressInfo } from "net";

env.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!webhookSecret) {
  throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
}

const app = express();

// Use JSON parser for all non-webhook routes
app.use(
  (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): void => {
    if (req.originalUrl === "/webhook") {
      next();
    } else {
      express.json()(req, res, next);
    }
  }
);

app.post(
  "/webhook",
  // Stripe requires the raw body to construct the event
  express.raw({ type: "application/json" }),
  (req: express.Request, res: express.Response): void => {
    const sig = req.headers["stripe-signature"];
    if (!sig) {
      res.status(400).send("Webhook Error: Missing stripe-signature header");
      return;
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown webhook error";
      res.status(400).send(`Webhook Error: ${errorMessage}`);
      return;
    }

    // Cast event data to Stripe object
    if (event.type === "payment_intent.succeeded") {
      const stripeObject: Stripe.PaymentIntent = event.data
        .object as Stripe.PaymentIntent;
      void stripeObject.status;
    } else if (event.type === "charge.succeeded") {
      const charge = event.data.object as Stripe.Charge;
      void charge.id;
    } else {
      console.warn(`🤷‍♀️ Unhandled event type: ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    res.json({ received: true });
  }
);

const server = app.listen(3001);
void (<AddressInfo>server.address()).port;
