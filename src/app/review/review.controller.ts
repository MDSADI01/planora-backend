import { Request, Response, NextFunction } from 'express';
import * as reviewService from './review.service';

export const addReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rating, reviewText } = req.body;
    const review = await reviewService.addReview(req.user!.userId, req.params.eventId as string, rating, reviewText);
    res.status(201).json({ success: true, data: review });
  } catch (error: any) {
    if (error.message.includes('attended')) error.status = 403;
    else error.status = 400;
    next(error);
  }
};

export const getReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reviews = await reviewService.getEventReviews(req.params.eventId as string);
    res.status(200).json({ success: true, data: reviews });
  } catch (error: any) {
    next(error);
  }
};

export const updateReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rating, reviewText } = req.body;
    const review = await reviewService.updateReview(req.params.reviewId as string, req.user!.userId, { rating, reviewText });
    res.status(200).json({ success: true, data: review });
  } catch (error: any) {
    if (error.message.includes('Unauthorized')) error.status = 403;
    else error.status = 400;
    next(error);
  }
};

export const deleteReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await reviewService.deleteReview(req.params.reviewId as string, req.user!.userId);
    res.status(200).json({ success: true, message: 'Review deleted successfully' });
  } catch (error: any) {
    if (error.message.includes('Unauthorized')) error.status = 403;
    else error.status = 400;
    next(error);
  }
};
