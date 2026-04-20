import { Request, Response, NextFunction } from 'express';
import { createError } from './errorHandler';

// Simple rate limiter for development
const requests = new Map<string, { count: number; resetTime: number }>();

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const clientIp = req.ip || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100;

  let clientData = requests.get(clientIp);
  
  if (!clientData || now > clientData.resetTime) {
    clientData = {
      count: 1,
      resetTime: now + windowMs
    };
    requests.set(clientIp, clientData);
    return next();
  }

  if (clientData.count >= maxRequests) {
    return next(createError('Too many requests. Please try again later.', 429));
  }

  clientData.count++;
  next();
};
