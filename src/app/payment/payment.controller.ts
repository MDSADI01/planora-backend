import { Request, Response } from 'express';
import * as paymentService from './payment.service';
import { PaymentStatus } from '../../generated/prisma/client';

export const initiatePayment = async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;
    const payment = await paymentService.initiatePayment(req.user!.userId, req.params.eventId as string, amount);
    
    // In a real scenario, you'd return the gateway URL to redirect the user
    res.status(201).json({ success: true, message: 'Payment initiated', data: payment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const paymentWebhook = async (req: Request, res: Response) => {
  try {
    const { transactionId, status } = req.body;
    const payment = await paymentService.handlePaymentCallback(transactionId, status as PaymentStatus);
    res.status(200).json({ success: true, data: payment });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
