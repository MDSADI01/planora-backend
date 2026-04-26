/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { PaymentService } from "./payment.service";
import { getStripe, getStripeWebhookSecret } from "../stripe/stripe.config";
import Stripe from "stripe";

const handleStripeWebhookEvent = async (req: Request, res: Response) => {
  try {
    const signature = req.headers["stripe-signature"] as string;
    const webhookSecret = getStripeWebhookSecret();
    const stripe = getStripe();

    if (!signature || !webhookSecret) {
      const error = new Error("Missing Stripe signature or webhook secret");
      (error as Error & { status?: number }).status = 400;
      throw error;
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch {
      const error = new Error("Error processing Stripe webhook");
      (error as Error & { status?: number }).status = 400;
      throw error;
    }

    const result = await PaymentService.handlerStripeWebhookEvent(event);

    return res.status(200).json({
      success: true,
      message: "Stripe webhook event processed successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(error.status || 500).json({
      message: error.message || "Error handling Stripe webhook event",
    });
  }
};

export const initiateEventPaymentController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user?.userId; // from auth middleware
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "eventId is required",
      });
    }

    const result = await PaymentService.initiateEventPayment(
      eventId,
      userId as string
    );

    return res.status(200).json({
      success: true,
      message: "Payment session created",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

export const PaymentController = {
  handleStripeWebhookEvent,
  initiateEventPaymentController,
};
