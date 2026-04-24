import { Router } from 'express';
import * as reviewController from './review.controller';
import { authorization } from '../middleware/auth.middleware';

const router = Router({ mergeParams: true });

router.get('/:eventId', reviewController.getReviews);
router.get('/myReviews', authorization(), reviewController.getMyReviews);
router.post('/:eventId', authorization(), reviewController.addReview);
router.put('/:reviewId', authorization(), reviewController.updateReview);
router.delete('/:reviewId', authorization(), reviewController.deleteReview);

export default router;
