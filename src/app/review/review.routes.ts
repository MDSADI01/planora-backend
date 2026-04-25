import { Router } from 'express';
import * as reviewController from './review.controller';
import { authorization } from '../middleware/auth.middleware';
import { Role } from '../../generated/prisma/enums';

const router = Router({ mergeParams: true });

router.get('/:eventId', reviewController.getReviews);
router.get('/myReviews', authorization(Role.USER), reviewController.getMyReviews);
router.post('/:eventId', authorization(Role.USER), reviewController.addReview);
router.put('/:reviewId', authorization(Role.USER), reviewController.updateReview);
router.delete('/:reviewId', authorization(Role.USER), reviewController.deleteReview);

export default router;
