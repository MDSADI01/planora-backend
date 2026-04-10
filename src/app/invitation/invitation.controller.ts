import { Request, Response } from 'express';
import * as invitationService from './invitation.service';
import { InvitationStatus } from '../../generated/prisma/client';

export const sendInvitation = async (req: Request, res: Response) => {
  try {
    const { inviteeId } = req.body;
    const invitation = await invitationService.sendInvitation(req.params.eventId as string, req.user!.userId, inviteeId);
    res.status(201).json({ success: true, data: invitation });
  } catch (error: any) {
    res.status(error.message.includes('Unauthorized') ? 403 : 400).json({ success: false, message: error.message });
  }
};

export const getMyInvitations = async (req: Request, res: Response) => {
  try {
    const invitations = await invitationService.getMyInvitations(req.user!.userId);
    res.status(200).json({ success: true, data: invitations });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const respondToInvitation = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const invitation = await invitationService.updateInvitationStatus(
      req.params.invitationId as string,
      req.user!.userId,
      status as InvitationStatus
    );
    res.status(200).json({ success: true, data: invitation });
  } catch (error: any) {
    res.status(error.message.includes('Unauthorized') ? 403 : 400).json({ success: false, message: error.message });
  }
};
