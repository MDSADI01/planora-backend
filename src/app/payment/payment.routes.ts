import { Router } from 'express';
import * as paymentController from './payment.controller';
import { authorization } from '../middleware/auth.middleware';


const router = Router({ mergeParams: true });


// Initiate a Stripe Checkout session — requires authentication
router.post('/initiate', authorization(), paymentController.initiateEventPaymentController);

export default router;
