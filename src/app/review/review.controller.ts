import { Request, Response } from 'express';
import * as reviewService from './review.service';

export const addReview = async (req: Request, res: Response) => {
  try {
    const { rating, reviewText } = req.body;
    const review = await reviewService.addReview(req.user!.userId, req.params.eventId as string, rating, reviewText);
    res.status(201).json({ success: true, data: review });
  } catch (error: any) {
    res.status(error.message.includes('attended') ? 403 : 400).json({ success: false, message: error.message });
  }
};

export const getReviews = async (req: Request, res: Response) => {
  try {
    const reviews = await reviewService.getEventReviews(req.params.eventId as string);
    res.status(200).json({ success: true, data: reviews });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateReview = async (req: Request, res: Response) => {
  try {
    const { rating, reviewText } = req.body;
    const review = await reviewService.updateReview(req.params.reviewId as string, req.user!.userId, { rating, reviewText });
    res.status(200).json({ success: true, data: review });
  } catch (error: any) {
    res.status(error.message.includes('Unauthorized') ? 403 : 400).json({ success: false, message: error.message });
  }
};

export const deleteReview = async (req: Request, res: Response) => {
  try {
    await reviewService.deleteReview(req.params.reviewId as string, req.user!.userId);
    res.status(200).json({ success: true, message: 'Review deleted successfully' });
  } catch (error: any) {
    res.status(error.message.includes('Unauthorized') ? 403 : 400).json({ success: false, message: error.message });
  }
};
