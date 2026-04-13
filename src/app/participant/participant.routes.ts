import { Router } from 'express';
import * as participantController from './participant.controller';
import { authorization } from '../middleware/auth.middleware';
import { Role } from '../../generated/prisma/enums';

const router = Router({ mergeParams: true }); // Merge params to get eventId from parent router

router.post('/', authorization(), participantController.joinEvent);
router.get('/', authorization(), participantController.getParticipants);
router.put('/:userId/status', authorization(Role.USER), participantController.updateStatus);

export default router;
