/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";
import { prisma } from "../../lib/prisma";
import { PaymentStatus, ParticipantStatus } from "../../generated/prisma/enums";
import { stripe } from "../stripe/stripe.config";

const FRONTEND_URL = process.env.FRONTEND_URL;

if (!FRONTEND_URL) {
  throw new Error("FRONTEND_URL is not defined in environment variables");
}

/**
 * =========================================
 * 🔥 STRIPE WEBHOOK HANDLER
 * =========================================
 */
const handlerStripeWebhookEvent = async (event: Stripe.Event) => {
  console.log("Got the webHook");
  // ✅ prevent duplicate webhook processing
  const existing = await prisma.payment.findFirst({
    where: {
      stripeEventId: event.id,
    },
  });

  if (existing) {
    console.log(`Event ${event.id} already processed`);
    return;
  }

  switch (event.type) {
    /**
     * =========================
     * ✅ PAYMENT SUCCESS
     * =========================
     */
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      const eventId = session.metadata?.eventId;
      const userId = session.metadata?.userId;
      const paymentId = session.metadata?.paymentId;

      if (!eventId || !userId || !paymentId) {
        console.error("Missing metadata in Stripe session");
        console.error("❌ Missing metadata:", { eventId, userId, paymentId });
        console.error("Full session metadata:", session.metadata);
        return;
      }

      const paymentIntentId = session.payment_intent as string;

      await prisma.$transaction(async (tx) => {
        // 1. Update payment (SAFE: by ID)
        await tx.payment.update({
          where: {
            id: paymentId,
          },
          data: {
            stripeEventId: event.id,
            transactionId: paymentIntentId,
            status: PaymentStatus.SUCCESS,
            paymentGateway: "stripe",
          },
        });

        // 2. Update participant
        await tx.eventParticipant.upsert({
          where: {
            userId_eventId: {
              userId,
              eventId,
            },
          },
          update: {
            paymentStatus: PaymentStatus.SUCCESS,
            status: ParticipantStatus.REGISTERED,
          },
          create: {
            userId,
            eventId,
            paymentStatus: PaymentStatus.SUCCESS,
            status: ParticipantStatus.REGISTERED,
          },
        });
      });

      console.log(`Payment SUCCESS for user ${userId}, event ${eventId}`);
      break;
    }

    /**
     * =========================
     * ❌ PAYMENT FAILED
     * =========================
     */
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      await prisma.payment.updateMany({
        where: {
          transactionId: paymentIntent.id,
        },
        data: {
          status: PaymentStatus.FAILED,
          stripeEventId: event.id,
        },
      });

      console.log(`Payment FAILED: ${paymentIntent.id}`);
      break;
    }

    /**
     * =========================
     * ⏳ SESSION EXPIRED
     * =========================
     */
    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;

      await prisma.payment.updateMany({
        where: {
          transactionId: session.payment_intent as string,
        },
        data: {
          status: PaymentStatus.FAILED,
          stripeEventId: event.id,
        },
      });

      console.log(`Session expired: ${session.id}`);
      break;
    }

    default:
      console.log(`Unhandled event: ${event.type}`);
  }

  return { message: "Webhook processed" };
};

/**
 * =========================================
 * 💳 INITIATE PAYMENT (STRIPE CHECKOUT)
 * =========================================
 */
const initiateEventPayment = async (eventId: string, userId: string) => {
  // 1. Find event
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new Error("Event not found");
  }

  if (event.fee === 0) {
    throw new Error("This is a free event");
  }

  // 2. Check participant
  const participant = await prisma.eventParticipant.findUnique({
    where: {
      userId_eventId: {
        userId,
        eventId,
      },
    },
  });

  if (!participant) {
    throw new Error("Join event before payment");
  }

  // 3. Prevent duplicate payment
  if (participant.paymentStatus === PaymentStatus.SUCCESS) {
    throw new Error("Payment already completed");
  }

  const existingPending = await prisma.payment.findFirst({
    where: {
      userId,
      eventId,
      status: PaymentStatus.PENDING,
    },
  });

  if (existingPending) {
    return {
      paymentUrl: `${FRONTEND_URL}/retry-payment?paymentId=${existingPending.id}`,
    };
  }

  // 4. Create payment
  const payment = await prisma.payment.create({
    data: {
      userId,
      eventId,
      amount: event.fee,
      paymentGateway: "stripe",
      status: PaymentStatus.PENDING,
    },
  });

  // 5. Create Stripe session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "bdt",
          product_data: {
            name: event.title,
          },
          unit_amount: Math.round(event.fee * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      eventId,
      userId,
      paymentId: payment.id,
    },
    success_url: `${FRONTEND_URL}/payment-success`,
    cancel_url: `${FRONTEND_URL}/payment-cancel`,
  });

  console.log(session.id);
  console.log("Metadata set:", { eventId, userId, paymentId: payment.id });

  return {
    paymentUrl: session.url,
  };
};

export const PaymentService = {
  handlerStripeWebhookEvent,
  initiateEventPayment,
};
