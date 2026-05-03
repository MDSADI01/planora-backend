import { EventType, EventCategory, EventTheme } from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { generateSmartRecommendations, generateSearchSuggestions } from '../ai/ai.service';

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
  eventTheme: EventTheme;
  organizerId: string;
}) => {
  return prisma.event.create({
    data,
  });
};

export const getEvents = async (filters: {
  eventCategory?: EventCategory;
  type?: EventType;
  eventTheme?: EventTheme;
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

  // ✅ filter by theme
  if (filters.eventTheme) {
    where.eventTheme = filters.eventTheme;
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

export const getTrendingEvents = async () => {
  const events = await prisma.event.findMany({
    where: {
      date: { gte: new Date() }, // Trending typically implies upcoming events
    },
    include: {
      organizer: {
        select: { id: true, name: true, image: true },
      },
      _count: {
        select: { participants: true, reviews: true },
      },
      reviews: {
        select: { rating: true },
      },
    },
  });

  // Calculate score in memory: (participant count * 2) + (avg rating * 3) + (review count * 1)
  const scoredEvents = events.map(event => {
    const avgRating =
      event.reviews.length > 0
        ? event.reviews.reduce((acc, r) => acc + r.rating, 0) / event.reviews.length
        : 0;

    const score = event._count.participants * 2 + avgRating * 3 + event._count.reviews * 1;

    return { ...event, _trendingScore: score, avgRating };
  });

  // Sort by score desc
  scoredEvents.sort((a, b) => b._trendingScore - a._trendingScore);

  // Return top 4, mapping to appropriate structure
  return scoredEvents.slice(0, 4).map(e => {
    const { _trendingScore, reviews, ...rest } = e;
    return rest;
  });
};

export const getSearchSuggestions = async (searchTerm: string) => {
  if (!searchTerm || searchTerm.length < 2) return [];

  const eventPool = await prisma.event.findMany({
    select: {
      id: true,
      title: true,
      eventCategory: true,
      image: true,
      date: true,
    },
    take: 50,
    orderBy: { date: "asc" },
    where: { date: { gte: new Date() } },
  });

  const aiSuggestedIds = await generateSearchSuggestions(
    searchTerm,
    eventPool.map((e) => ({
      id: e.id,
      title: e.title,
      category: e.eventCategory,
    }))
  );

  if (!aiSuggestedIds || aiSuggestedIds.length === 0) {
    return eventPool
      .filter((e) => e.title.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, 5);
  }

  return aiSuggestedIds
    .map((id) => eventPool.find((e) => e.id === id))
    .filter(Boolean);
};

export const getRecommendations = async (userId: string) => {
  const participations = await prisma.eventParticipant.findMany({
    where: { userId },
    include: { event: { select: { eventCategory: true, eventTheme: true } } },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  const reviews = await prisma.review.findMany({
    where: { userId },
    include: { event: { select: { eventCategory: true, eventTheme: true } } },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  const preferredCategories = new Set<EventCategory>();
  const preferredThemes = new Set<EventTheme>();

  participations.forEach((p) => {
    preferredCategories.add(p.event.eventCategory);
    preferredThemes.add(p.event.eventTheme);
  });

  reviews.forEach((r) => {
    if (r.rating >= 4) {
      preferredCategories.add(r.event.eventCategory);
      preferredThemes.add(r.event.eventTheme);
    }
  });

  const upcomingEventsPool = await prisma.event.findMany({
    where: {
      date: { gte: new Date() },
      participants: { none: { userId } },
    },
    select: {
      id: true,
      title: true,
      eventCategory: true,
      eventTheme: true,
      date: true,
    },
    take: 20,
  });

  const relatedCategories = Array.from(preferredCategories);
  const relatedThemes = Array.from(preferredThemes);

  const aiRecommendedIds = await generateSmartRecommendations(
    { relatedCategories, relatedThemes },
    upcomingEventsPool
  );

  let finalIds = aiRecommendedIds;
  if (!finalIds || finalIds.length === 0) {
    finalIds = upcomingEventsPool.slice(0, 10).map((e) => e.id);
  }

  return prisma.event.findMany({
    where: { id: { in: finalIds } },
    include: {
      organizer: {
        select: { id: true, name: true, image: true },
      },
    },
    orderBy: { date: "asc" },
  });
};
