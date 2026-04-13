import express, { Application, Request, Response } from "express";
import authRoutes from "./app/auth/auth.routes";
import eventRoutes from "./app/event/event.routes";
import participantRoutes from "./app/participant/participant.routes";
import invitationRoutes from "./app/invitation/invitation.routes";
import paymentRoutes from "./app/payment/payment.routes";
import reviewRoutes from "./app/review/review.routes";
import adminRoutes from "./app/admin/admin.routes";
import { globalErrorHandler } from "./app/middleware/error.middleware";

const app: Application = express();
export const port = process.env.PORT || 8000;

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/events/:eventId/participants', participantRoutes);
app.use('/api/events/:eventId/reviews', reviewRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/payments', paymentRoutes);

// Basic route
app.get('/', (req: Request, res: Response) => {
  res.send('Planora API running successfully!');
});

// Global Error Handler
app.use(globalErrorHandler);

export default app;