import { Router } from 'express';
import * as eventController from './event.controller';
import { authorization } from '../middleware/auth.middleware';
import { Role } from '../../generated/prisma/enums';

const router = Router();

router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEventById);

router.post('/', authorization(Role.USER), eventController.createEvent);
router.put('/:id', authorization(Role.USER), eventController.updateEvent);
router.delete('/:id', authorization(), eventController.deleteEvent);

export default router;
