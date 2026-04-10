import { Router } from 'express';
import * as paymentController from './payment.controller';
import { authorization } from '../middleware/auth.middleware';

const router = Router({ mergeParams: true });

router.post('/initiate', authorization(), paymentController.initiatePayment);

// For testing mock payments easily without auth
router.post('/webhook', paymentController.paymentWebhook); 

export default router;
