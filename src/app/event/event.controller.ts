import { Request, Response } from 'express';
import * as eventService from './event.service';
import { EventType } from '../../generated/prisma/client';

export const createEvent = async (req: Request, res: Response) => {
  try {
    const { title, description, date, time, venue, type, fee, isPrivate } = req.body;
    const userId = req.user!.userId;

    const event = await eventService.createEvent({
      title,
      description,
      date: new Date(date),
      time,
      venue,
      type: type as EventType,
      fee: fee ? Number(fee) : 0,
      isPrivate: isPrivate === true || isPrivate === 'true',
      organizerId: userId,
    });

    res.status(201).json({ success: true, data: event });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEvents = async (req: Request, res: Response) => {
  try {
    const { isPrivate, type, search, isFree } = req.query;

    const filters = {
      isPrivate: isPrivate !== undefined ? isPrivate === 'true' : false, // Default to public
      type: type as EventType | undefined,
      searchTerm: search as string | undefined,
      isFree: isFree !== undefined ? isFree === 'true' : undefined,
    };

    const events = await eventService.getEvents(filters);
    res.status(200).json({ success: true, data: events });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEventById = async (req: Request, res: Response) => {
  try {
    const event = await eventService.getEventById(req.params.id as string);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.status(200).json({ success: true, data: event });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const event = await eventService.updateEvent(req.params.id as string, req.user!.userId, req.body);
    res.status(200).json({ success: true, data: event });
  } catch (error: any) {
    res.status(error.message.includes('Unauthorized') ? 403 : 500).json({ success: false, message: error.message });
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    await eventService.deleteEvent(req.params.id as string, req.user!.userId, req.user!.role);
    res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (error: any) {
    res.status(error.message.includes('Unauthorized') ? 403 : 500).json({ success: false, message: error.message });
  }
};
