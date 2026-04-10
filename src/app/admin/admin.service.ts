import { prisma } from '../../lib/prisma';

export const getAllUsers = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      createdAt: true
    }
  });
};

export const deleteUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  
  return prisma.user.delete({ where: { id: userId } });
};

export const getAllEvents = async () => {
  return prisma.event.findMany({
    include: {
      organizer: { select: { id: true, name: true, email: true } },
      _count: {
        select: {
          participants: true,
          payments: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const deleteEventById = async (eventId: string) => {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new Error('Event not found');
  
  return prisma.event.delete({ where: { id: eventId } });
};
