import { Router } from 'express';
import * as participantController from './participant.controller';
import { authorization } from '../middleware/auth.middleware';


const router = Router(); // Merge params to get eventId from parent router

router.post('/', authorization(), participantController.joinEvent);
router.get('/', authorization(), participantController.getParticipants);
router.put('/:userId/status', authorization(), participantController.updateStatus);

export default router;
