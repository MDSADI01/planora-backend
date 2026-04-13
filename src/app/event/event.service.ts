import { EventType, EventCategory } from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';

export const createEvent = async (data: {
  title: string;
  description: string;
  date: Date;
  time: string;
  venue?: string;
  image: string;
  type: EventType;
  fee?: number;
  eventCategory?: EventCategory;
  organizerId: string;
}) => {
  return prisma.event.create({
    data,
  });
};

export const getEvents = async (filters: {
  eventCategory?: EventCategory;
  type?: EventType;
  searchTerm?: string;
  isFree?: boolean;
}) => {
  const where: any = {};

  // ✅ filter by category
  if (filters.eventCategory) {
    where.eventCategory = filters.eventCategory;
  }

  // ✅ filter by type
  if (filters.type) {
    where.type = filters.type;
  }

  // ✅ filter by free / paid
  if (filters.isFree !== undefined) {
    if (filters.isFree) {
      // free events: fee = 0 OR fee = null
      where.OR = [
        { fee: 0 },
        { fee: null },
      ];
    } else {
      // paid events
      where.fee = { gt: 0 };
    }
  }

  // ✅ search filter
  if (filters.searchTerm) {
    const searchConditions = [
      { title: { contains: filters.searchTerm, mode: 'insensitive' } },
      { organizer: { name: { contains: filters.searchTerm, mode: 'insensitive' } } },
    ];

    if (where.OR) {
      // 🔥 combine previous OR (fee) with search OR
      where.AND = [
        { OR: where.OR },
        { OR: searchConditions },
      ];
      delete where.OR;
    } else {
      where.OR = searchConditions;
    }
  }

  return prisma.event.findMany({
    where, // ✅ if empty → returns ALL events
    include: {
      organizer: {
        select: { id: true, name: true, image: true },
      },
    },
    orderBy: {
      date: 'asc',
    },
  });
};

// export const getEvents = async () => {
//   return prisma.event.findMany({
//     include: {
//       organizer: true,
//     },
//   });
// };



// export const getEvents = async (filters: {
//   eventCategory?: EventCategory;
//   type?: EventType;
//   searchTerm?: string;
//   isFree?: boolean;
// }) => {
//   return prisma.event.findMany({
//     where: {
//       eventCategory: filters.eventCategory,
//       type: filters.type,
//       ...(filters.isFree !== undefined && { fee: filters.isFree ? 0 : { gt: 0 } }),
//       ...(filters.searchTerm && {
//         OR: [
//           { title: { contains: filters.searchTerm, mode: 'insensitive' } },
//           { organizer: { name: { contains: filters.searchTerm, mode: 'insensitive' } } },
//         ],
//       }),
//     },
//     include: {
//       organizer: { select: { id: true, name: true, image: true } },
//     },
//     orderBy: {
//       date: 'asc',
//     },
//   });
// };

export const getEventById = async (id: string) => {
  return prisma.event.findUnique({
    where: { id },
    include: {
      organizer: { select: { id: true, name: true, image: true } },
      participants: true,
      reviews: { include: { user: { select: { name: true, image: true } } } },
    },
  });
};

export const updateEvent = async (id: string, organizerId: string, data: any) => {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.organizerId !== organizerId) {
    throw new Error('Unauthorized or event not found');
  }
  return prisma.event.update({
    where: { id },
    data,
  });
};

export const deleteEvent = async (id: string, userId: string, userRole: string) => {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) throw new Error('Event not found');

  if (event.organizerId !== userId && userRole !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  return prisma.event.delete({ where: { id } });
};
