import { Request, Response } from 'express';
import * as adminService from './admin.service';

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await adminService.getAllUsers();
    res.status(200).json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    await adminService.deleteUserById(req.params.id as string);
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(error.message.includes('not found') ? 404 : 500).json({ success: false, message: error.message });
  }
};

export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const events = await adminService.getAllEvents();
    res.status(200).json({ success: true, data: events });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    await adminService.deleteEventById(req.params.id as string);
    res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (error: any) {
    res.status(error.message.includes('not found') ? 404 : 500).json({ success: false, message: error.message });
  }
};
