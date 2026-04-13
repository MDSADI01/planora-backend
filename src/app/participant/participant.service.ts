import { ParticipantStatus, PaymentStatus, EventCategory } from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';

export const joinEvent = async (userId: string, eventId: string) => {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new Error('Event not found');

  const existingParticipant = await prisma.eventParticipant.findUnique({
    where: { userId_eventId: { userId, eventId } }
  });

  if (existingParticipant) throw new Error('Already participated or requested');

  // If free and public, approve immediately. Otherwise pending.
  const isFreePublic = (event.fee === 0 && event.eventCategory === EventCategory.PUBLIC);
  const status = isFreePublic ? ParticipantStatus.APPROVED : ParticipantStatus.PENDING;

  return prisma.eventParticipant.create({
    data: {
      userId,
      eventId,
      status,
      paymentStatus: isFreePublic ? PaymentStatus.SUCCESS : PaymentStatus.PENDING
    }
  });
};

export const updateParticipantStatus = async (
  eventId: string, 
  userIdToUpdate: string, 
  status: ParticipantStatus, 
  hostId: string
) => {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.organizerId !== hostId) {
    throw new Error('Unauthorized or event not found');
  }

  return prisma.eventParticipant.update({
    where: { userId_eventId: { userId: userIdToUpdate, eventId } },
    data: { status }
  });
};

export const getParticipants = async (eventId: string, hostId: string) => {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.organizerId !== hostId) {
    throw new Error('Unauthorized or event not found');
  }

  return prisma.eventParticipant.findMany({
    where: { eventId },
    include: { user: { select: { id: true, name: true, email: true, image: true } } }
  });
};
