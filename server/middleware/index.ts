import { Request, Response, NextFunction } from 'express';
import { container } from '../container';
import { AppError } from '../utils/errors';
import { ZodError } from 'zod';

const authService = container.authService;
const subRepo = container.subRepo;
const usageRepo = container.usageRepo;

export const authenticate = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = authService.verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  req.user = decoded;
  next();
};

export const quotaCheck = async (req: any, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.schoolId) return next();

  const sub = await subRepo.getBySchoolId(req.user.schoolId);
  if (!sub) return next();

  const limits: Record<string, number> = {
    'Basic': 1000,
    'Pro': 5000,
    'Enterprise': 50000
  };

  const currentCalls = await usageRepo.getMetric(req.user.schoolId, 'ApiCalls');
  if (currentCalls >= (limits[sub.PlanType] || 1000)) {
    return res.status(429).json({ message: 'API Quota exceeded for your plan' });
  }

  // Increment usage asynchronously
  usageRepo.incrementMetric(req.user.schoolId, 'ApiCalls').catch(console.error);
  next();
};

export const checkSubscription = async (req: any, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.schoolId) return next();

  // SuperAdmin might bypass or we check for specific school
  const sub = await subRepo.getBySchoolId(req.user.schoolId);
  if (!sub) {
    return res.status(403).json({ message: 'No active subscription found for this tenant' });
  }

  const now = new Date();
  if (new Date(sub.EndDate) < now) {
    return res.status(403).json({ message: 'Subscription has expired' });
  }

  next();
};

export const authorize = (roles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    
    const hasRole = req.user.roles.some((role: string) => roles.includes(role));
    if (!hasRole) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};

export const checkCampusAccess = (req: any, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  
  // SuperAdmin has access to all
  if (req.user.roles.includes('SuperAdmin')) return next();

  const requestedCampusId = req.query.campusId || req.body.campusId || req.params.campusId;
  if (requestedCampusId && !req.user.campusIds.includes(parseInt(requestedCampusId))) {
    return res.status(403).json({ message: 'Forbidden: No access to this campus' });
  }
  next();
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      code: err.errorCode,
      message: err.message
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Invalid input data',
      errors: err.issues
    });
  }

  console.error('[FATAL ERROR]', err);
  res.status(500).json({ 
    status: 'error',
    message: 'Internal Server Error' 
  });
};
