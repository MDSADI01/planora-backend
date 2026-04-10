import { Router } from 'express';
import * as adminController from './admin.controller';
import { authorization } from '../middleware/auth.middleware';
import { Role } from '../../generated/prisma/enums';

const router = Router();

// Apply auth and admin-only rules to ALL routes inside this router
router.use(authorization(Role.ADMIN));

router.get('/users', adminController.getAllUsers);
router.delete('/users/:id', adminController.deleteUser);

router.get('/events', adminController.getAllEvents);
router.delete('/events/:id', adminController.deleteEvent);

export default router;
