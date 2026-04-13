import { Request, Response, NextFunction } from 'express';
import * as invitationService from './invitation.service';
import { InvitationStatus } from '../../generated/prisma/client';

export const sendInvitation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { inviteeId } = req.body;
    const invitation = await invitationService.sendInvitation(req.params.eventId as string, req.user!.userId, inviteeId);
    res.status(201).json({ success: true, data: invitation });
  } catch (error: any) {
    if (error.message.includes('Unauthorized')) error.status = 403;
    else if (error.message.includes('not found')) error.status = 404;
    else error.status = 400;
    next(error);
  }
};

export const getMyInvitations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invitations = await invitationService.getMyInvitations(req.user!.userId);
    res.status(200).json({ success: true, data: invitations });
  } catch (error: any) {
    next(error);
  }
};

export const respondToInvitation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const invitation = await invitationService.updateInvitationStatus(
      req.params.invitationId as string,
      req.user!.userId,
      status as InvitationStatus
    );
    res.status(200).json({ success: true, data: invitation });
  } catch (error: any) {
    if (error.message.includes('Unauthorized')) error.status = 403;
    else if (error.message.includes('not found')) error.status = 404;
    else error.status = 400;
    next(error);
  }
};
