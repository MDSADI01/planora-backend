import { Router } from 'express';
import * as eventController from './event.controller';
import { authorization } from '../middleware/auth.middleware';

const router = Router();

router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEventById);

router.post('/', authorization(), eventController.createEvent);
router.put('/:id', authorization(), eventController.updateEvent);
router.delete('/:id', authorization(), eventController.deleteEvent);

export default router;
