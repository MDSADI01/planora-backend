import { Router } from 'express';
import * as invitationController from './invitation.controller';
import { authorization } from '../middleware/auth.middleware';

const router = Router({ mergeParams: true });

// Event host sending invitation: mounted at /api/events/:eventId/invitations
router.post('/', authorization(), invitationController.sendInvitation);

// Invitee viewing and responding: mounted at /api/invitations
router.get('/', authorization(), invitationController.getMyInvitations);
router.put('/:invitationId/status', authorization(), invitationController.respondToInvitation);

export default router;
