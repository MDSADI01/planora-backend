import { InvitationStatus, PaymentStatus } from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';

export const sendInvitation = async (eventId: string, hostId: string, inviteeId: string) => {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.organizerId !== hostId) {
    throw new Error('Unauthorized or event not found');
  }

  const existingInvitation = await prisma.invitation.findUnique({
    where: { eventId_inviteeId: { eventId, inviteeId } }
  });

  if (existingInvitation) throw new Error('Invitation already sent');

  return prisma.invitation.create({
    data: {
      eventId,
      inviteeId,
    }
  });
};

export const getMyInvitations = async (userId: string) => {
  return prisma.invitation.findMany({
    where: { inviteeId: userId },
    include: { event: { include: { organizer: { select: { id: true, name: true } } } } }
  });
};

export const updateInvitationStatus = async (invitationId: string, userId: string, status: InvitationStatus) => {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    include: { event: true }
  });

  if (!invitation || invitation.inviteeId !== userId) {
    throw new Error('Unauthorized or invitation not found');
  }

  if (status === InvitationStatus.ACCEPTED && invitation.event.fee > 0 && invitation.paymentStatus !== PaymentStatus.SUCCESS) {
    throw new Error('Payment required before accepting');
  }

  return prisma.invitation.update({
    where: { id: invitationId },
    data: { status }
  });
};
