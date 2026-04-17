import { Request, Response, NextFunction } from 'express';
import * as paymentService from './payment.service';
import { PaymentStatus } from '../../generated/prisma/client';

export const initiatePayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount,eventId } = req.body;
    const payment = await paymentService.initiatePayment(req.user!.userId, eventId , amount);
    
    // In a real scenario, you'd return the gateway URL to redirect the user
    res.status(201).json({ success: true, message: 'Payment initiated', data: payment });
  } catch (error: any) {
    next(error);
  }
};

export const paymentWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { transactionId, status } = req.body;
    const payment = await paymentService.handlePaymentCallback(transactionId, status as PaymentStatus);
    res.status(200).json({ success: true, data: payment });
  } catch (error: any) {
    error.status = 400;
    next(error);
  }
};
