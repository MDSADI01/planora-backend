import { ParticipantStatus } from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';

export const addReview = async (userId: string, eventId: string, rating: number, reviewText?: string) => {
  // Check if they attended
  const participant = await prisma.eventParticipant.findUnique({
    where: { userId_eventId: { userId, eventId } }
  });

  const organizerId = await prisma.event.findUnique({
    where: {id: eventId},
    select:{
      organizerId: true
    }
  })

  if(organizerId?.organizerId === userId){
    throw new Error('Organizer cannot review their own event');
  }

 

  if (!participant || participant.status !== ParticipantStatus.ATTENDED) {
    throw new Error('You can only review events you have attended');
  }

  return prisma.review.create({
    data: {
      userId,
      eventId,
      rating,
      reviewText
    }
  });
};

export const getEventReviews = async (eventId: string) => {
  return prisma.review.findMany({
    where: { eventId },
    include: { user: { select: { name: true, image: true } } }
  });
};

export const getMyReviews = async (userId: string) => {
  return prisma.review.findMany({
    where: { userId },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          image: true,
          date: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const updateReview = async (reviewId: string, userId: string, data: { rating?: number; reviewText?: string }) => {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review || review.userId !== userId) {
    throw new Error('Unauthorized or review not found');
  }

  return prisma.review.update({
    where: { id: reviewId },
    data
  });
};




export const deleteReview = async (reviewId: string, userId: string) => {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review || review.userId !== userId) {
    throw new Error('Unauthorized or review not found');
  }

  return prisma.review.delete({ where: { id: reviewId } });
};
