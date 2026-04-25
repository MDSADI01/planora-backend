 
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { PaymentService } from "./payment.service";
import { STRIPE_WEBHOOK_SECRET, stripe } from "../stripe/stripe.config";
import Stripe from "stripe";

const handleStripeWebhookEvent = async (req : Request, res : Response) => {
    const signature = req.headers['stripe-signature'] as string
    const webhookSecret = STRIPE_WEBHOOK_SECRET;
    console.log("Webhook hit. Body type:", typeof req.body, "| Is Buffer:", Buffer.isBuffer(req.body));
  console.log("Signature present:", !!signature);
  console.log("Webhook secret present:", !!webhookSecret);

    if(!signature || !webhookSecret){
        console.error("Missing Stripe signature or webhook secret");
        return res.status(400).json({message : "Missing Stripe signature or webhook secret"})
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (error : any) {
        console.error("Error processing Stripe webhook:", error);
        return res.status(400).json({message : "Error processing Stripe webhook"})
    }

    try {
        const result = await PaymentService.handlerStripeWebhookEvent(event);

       return res.status(200).json({
      success: true,
      message: "Stripe webhook event processed successfully",
      data: result,
    });
    } catch (error) {
        console.error("Error handling Stripe webhook event:", error);
        return res.status(500).json({message : "Error handling Stripe webhook event"})
    }
}


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

    const result = await PaymentService.initiateEventPayment(eventId, userId as string);

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
    handleStripeWebhookEvent,initiateEventPaymentController
}