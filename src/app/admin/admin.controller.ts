import { Request, Response, NextFunction } from 'express';
import * as adminService from './admin.service';

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await adminService.getAllUsers();
    res.status(200).json({ success: true, data: users });
  } catch (error: any) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await adminService.deleteUserById(req.params.id as string);
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    if (error.message.includes('not found')) error.status = 404;
    next(error);
  }
};

export const getAllEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await adminService.getAllEvents();
    res.status(200).json({ success: true, data: events });
  } catch (error: any) {
    next(error);
  }
};

export const deleteEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await adminService.deleteEventById(req.params.id as string);
    res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (error: any) {
    if (error.message.includes('not found')) error.status = 404;
    next(error);
  }
};
