import { ParticipantStatus, PaymentStatus } from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';

export const joinEvent = async (userId: string, eventId: string) => {
  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event) throw new Error("Event not found");

  if (event.organizerId === userId) {
    throw new Error("Organizer cannot join their own event");
  }

  const existingParticipant = await prisma.eventParticipant.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });

  if (existingParticipant) {
    return existingParticipant;
  }

  const isFree = event.fee === 0;

  // ✅ FREE EVENT
  if (isFree) {
    return prisma.eventParticipant.create({
      data: {
        userId,
        eventId,
        status: ParticipantStatus.REGISTERED, // directly confirmed
        paymentStatus: PaymentStatus.SUCCESS,
      },
    });
  }

  // 💳 PAID EVENT
  return prisma.eventParticipant.create({
    data: {
      userId,
      eventId,
      status: ParticipantStatus.PENDING, // waiting for payment
      paymentStatus: PaymentStatus.PENDING,
    },
  });
};

export const updateParticipantStatus = async (

  participantIdToUpdate: string, 
  status: ParticipantStatus, 
  hostId: string
) => {

  const participant = await prisma.eventParticipant.findFirst({
    where: {
      id: participantIdToUpdate,
      event: {
        organizerId: hostId
      }
    }
  });

  if (!participant) {
    throw new Error("Unauthorized or participant not found");
  }


  return prisma.eventParticipant.update({
    where: { id: participantIdToUpdate },
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
