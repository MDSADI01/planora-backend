import {
  EventCategory,
  EventTheme,
  EventType,
  Prisma,
} from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import {
  generateSearchSuggestions,
  generateSmartRecommendations,
} from "../ai/ai.service";

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
    data: {
      title: data.title,
      description: data.description,
      date: data.date,
      time: data.time,
      image: data.image,
      type: data.type,
      fee: data.fee ?? 0,
      eventTheme: data.eventTheme,
      organizerId: data.organizerId,
      ...(data.venue !== undefined && { venue: data.venue }),
      ...(data.eventCategory !== undefined && {
        eventCategory: data.eventCategory,
      }),
    },
  });
};

export const getEvents = async (filters: {
  eventCategory?: EventCategory;
  type?: EventType;
  eventTheme?: EventTheme;
  searchTerm?: string;
  isFree?: boolean;
}) => {
  const where: Prisma.EventWhereInput = {};

  if (filters.eventCategory) {
    where.eventCategory = filters.eventCategory;
  }

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.eventTheme) {
    where.eventTheme = filters.eventTheme;
  }

  if (filters.isFree !== undefined) {
    where.fee = filters.isFree ? 0 : { gt: 0 };
  }

  if (filters.searchTerm) {
    const searchConditions: Prisma.EventWhereInput[] = [
      { title: { contains: filters.searchTerm, mode: "insensitive" } },
      {
        organizer: {
          name: { contains: filters.searchTerm, mode: "insensitive" },
        },
      },
    ];

    where.AND = [{ OR: searchConditions }];
  }

  return prisma.event.findMany({
    where,
    include: {
      organizer: {
        select: { id: true, name: true, image: true },
      },
    },
    orderBy: {
      date: "asc",
    },
  });
};

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

export const updateEvent = async (
  id: string,
  organizerId: string,
  data: Prisma.EventUpdateInput
) => {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.organizerId !== organizerId) {
    throw new Error("Unauthorized or event not found");
  }

  return prisma.event.update({
    where: { id },
    data,
  });
};

export const deleteEvent = async (
  id: string,
  userId: string,
  userRole: string
) => {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) {
    throw new Error("Event not found");
  }

  if (event.organizerId !== userId && userRole !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  return prisma.event.delete({ where: { id } });
};

export const getTrendingEvents = async () => {
  const events = await prisma.event.findMany({
    where: {
      date: { gte: new Date() },
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

  const scoredEvents = events.map((event) => {
    const avgRating =
      event.reviews.length > 0
        ? event.reviews.reduce((acc, review) => acc + review.rating, 0) /
          event.reviews.length
        : 0;

    const score =
      event._count.participants * 2 + avgRating * 3 + event._count.reviews;

    return { ...event, _trendingScore: score, avgRating };
  });

  scoredEvents.sort((a, b) => b._trendingScore - a._trendingScore);

  return scoredEvents.slice(0, 4).map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    date: event.date,
    time: event.time,
    venue: event.venue,
    type: event.type,
    fee: event.fee,
    image: event.image,
    eventCategory: event.eventCategory,
    eventTheme: event.eventTheme,
    organizerId: event.organizerId,
    organizer: event.organizer,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
    _count: event._count,
    avgRating: event.avgRating,
  }));
};

export const getSearchSuggestions = async (searchTerm: string) => {
  if (!searchTerm || searchTerm.length < 2) {
    return [];
  }

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
    eventPool.map((event) => ({
      id: event.id,
      title: event.title,
      category: event.eventCategory,
    }))
  );

  if (!aiSuggestedIds || aiSuggestedIds.length === 0) {
    return eventPool
      .filter((event) =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 5);
  }

  return aiSuggestedIds
    .map((id) => eventPool.find((event) => event.id === id))
    .filter((event): event is (typeof eventPool)[number] => event !== undefined);
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

  participations.forEach((participation) => {
    preferredCategories.add(participation.event.eventCategory);
    preferredThemes.add(participation.event.eventTheme);
  });

  reviews.forEach((review) => {
    if (review.rating >= 4) {
      preferredCategories.add(review.event.eventCategory);
      preferredThemes.add(review.event.eventTheme);
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
    finalIds = upcomingEventsPool.slice(0, 10).map((event) => event.id);
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
