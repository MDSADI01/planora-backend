import { Request, Response, NextFunction } from "express";
import * as eventService from "./event.service";
import { EventType, EventCategory } from "../../generated/prisma/client";

export const createEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      title,
      description,
      date,
      time,
      venue,
      image,
      type,
      fee,
      eventCategory,
    } = req.body;
    const userId = req.user!.userId;

    const event = await eventService.createEvent({
      title,
      description,
      date: new Date(date),
      time,
      venue,
      image,
      type: type as EventType,
      fee: fee ? Number(fee) : 0,
      eventCategory: eventCategory as EventCategory,
      organizerId: userId,
    });

    res.status(201).json({ success: true, data: event });
  } catch (error: any) {
    next(error);
  }
};

export const getEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { eventCategory, type, search, isFree } = req.query;

    const filters = {
      eventCategory: eventCategory as EventCategory | undefined,
      type: type as EventType | undefined,
      searchTerm: search as string | undefined,
      isFree: isFree !== undefined ? isFree === "true" : undefined,
    };

    const events = await eventService.getEvents(filters);
    events;
    res.status(200).json({ success: true, data: events });
  } catch (error: any) {
    next(error);
  }
};

export const getEventById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const event = await eventService.getEventById(req.params.id as string);
    if (!event)
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    res.status(200).json({ success: true, data: event });
  } catch (error: any) {
    next(error);
  }
};

export const updateEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const event = await eventService.updateEvent(
      req.params.id as string,
      req.user!.userId,
      req.body
    );
    res.status(200).json({ success: true, data: event });
  } catch (error: any) {
    if (error.message.includes("Unauthorized")) error.status = 403;
    next(error);
  }
};

export const deleteEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await eventService.deleteEvent(
      req.params.id as string,
      req.user!.userId,
      req.user!.role
    );
    res
      .status(200)
      .json({ success: true, message: "Event deleted successfully" });
  } catch (error: any) {
    if (error.message.includes("Unauthorized")) error.status = 403;
    next(error);
  }
};
