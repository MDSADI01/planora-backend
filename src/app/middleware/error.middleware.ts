import { Request, Response, NextFunction } from 'express';
import { Prisma } from '../../generated/prisma/client';

type AppError = Error & {
  status?: number;
  stack?: string;
};

const isAppError = (err: unknown): err is AppError => {
  return err instanceof Error;
};

export const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  void req;
  void next;

  let statusCode = isAppError(err) ? err.status ?? 500 : 500;
  let message = isAppError(err) ? err.message : 'Internal Server Error';

  // Prisma Errors Handling
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = 409;
      message = 'A record with this value already exists (Unique constraint failed).';
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Record not found.';
    } else {
      statusCode = 400;
      message = `Database request error: ${err.message}`;
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid data provided. Please check your request parameters.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' &&
      isAppError(err) && { stack: err.stack }),
  });
};
