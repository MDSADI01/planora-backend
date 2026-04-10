import { PaymentStatus, ParticipantStatus, InvitationStatus } from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import crypto from 'crypto';

export const initiatePayment = async (userId: string, eventId: string, amount: number) => {
  return prisma.payment.create({
    data: {
      userId,
      eventId,
      amount,
      paymentGateway: 'mock-gateway',
      status: PaymentStatus.PENDING,
      transactionId: crypto.randomUUID()
    }
  });
};

export const handlePaymentCallback = async (transactionId: string, status: PaymentStatus) => {
  const payment = await prisma.payment.findUnique({ where: { transactionId } });
  if (!payment) throw new Error('Payment not found');

  // Update payment status
  const updatedPayment = await prisma.payment.update({
    where: { transactionId },
    data: { status }
  });

  if (status === PaymentStatus.SUCCESS) {
    // If successfully paid, try to update participant or invitation
    // Let's check Participant
    await prisma.eventParticipant.updateMany({
      where: { userId: payment.userId, eventId: payment.eventId },
      data: { paymentStatus: PaymentStatus.SUCCESS }
    });

    // Check Invitations
    await prisma.invitation.updateMany({
      where: { inviteeId: payment.userId, eventId: payment.eventId },
      data: { paymentStatus: PaymentStatus.SUCCESS }
    });
  }

  return updatedPayment;
};
