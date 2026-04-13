import { Request, Response, NextFunction } from 'express';
import * as participantService from './participant.service';
import { ParticipantStatus } from '../../generated/prisma/client';

export const joinEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const { eventId } = req.body;
    const participant = await participantService.joinEvent(req.user!.userId, eventId);
    res.status(201).json({ success: true, data: participant });
  } catch (error: any) {
    if (error.message.includes('not found')) error.status = 404;
    else error.status = 400;
    next(error);
  }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const participant = await participantService.updateParticipantStatus(
      req.params.eventId as string,
      req.params.userId as string,
      status as ParticipantStatus,
      req.user!.userId
    );
    res.status(200).json({ success: true, data: participant });
  } catch (error: any) {
    if (error.message.includes('Unauthorized')) error.status = 403;
    next(error);
  }
};

export const getParticipants = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const participants = await participantService.getParticipants(req.params.eventId as string, req.user!.userId);
    res.status(200).json({ success: true, data: participants });
  } catch (error: any) {
    if (error.message.includes('Unauthorized')) error.status = 403;
    next(error);
  }
};
