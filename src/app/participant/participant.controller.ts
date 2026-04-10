import { Request, Response } from 'express';
import * as participantService from './participant.service';
import { ParticipantStatus } from '../../generated/prisma/client';

export const joinEvent = async (req: Request, res: Response) => {
  try {
    const participant = await participantService.joinEvent(req.user!.userId, req.params.eventId as string);
    res.status(201).json({ success: true, data: participant });
  } catch (error: any) {
    res.status(error.message.includes('not found') ? 404 : 400).json({ success: false, message: error.message });
  }
};

export const updateStatus = async (req: Request, res: Response) => {
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
    res.status(error.message.includes('Unauthorized') ? 403 : 500).json({ success: false, message: error.message });
  }
};

export const getParticipants = async (req: Request, res: Response) => {
  try {
    const participants = await participantService.getParticipants(req.params.eventId as string, req.user!.userId);
    res.status(200).json({ success: true, data: participants });
  } catch (error: any) {
    res.status(error.message.includes('Unauthorized') ? 403 : 500).json({ success: false, message: error.message });
  }
};
