import express, { Application, Request, Response } from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./app/auth/auth.routes";
import eventRoutes from "./app/event/event.routes";
import participantRoutes from "./app/participant/participant.routes";
import invitationRoutes from "./app/invitation/invitation.routes";
import paymentRoutes from "./app/payment/payment.routes";
import reviewRoutes from "./app/review/review.routes";
import adminRoutes from "./app/admin/admin.routes";
import { globalErrorHandler } from "./app/middleware/error.middleware";
import { PaymentController } from "./app/payment/payment.controller";

const app: Application = express();
export const port = process.env.PORT || 8000;

// Payment routes (includes /webhook with raw body parser for Stripe signature verification)

app.post("/webhook", express.raw({ type: "*/*" }), PaymentController.handleStripeWebhookEvent)

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to parse cookies
app.use(cookieParser());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/payments', paymentRoutes);


// Basic route
app.get('/', (req: Request, res: Response) => {
  res.send('Planora API running successfully!');
});

// Global Error Handler
app.use(globalErrorHandler);

export default app;