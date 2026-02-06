import { Request, Response, NextFunction } from 'express';

/**
 * Role-Based Access Control middleware
 * TODO: Implement actual RBAC checks based on Stytch user roles
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // TODO: Check if user has admin role
    // const user = req.user;
    // if (!user || !user.roles?.includes('admin')) {
    //   return res.status(403).json({ error: 'Forbidden: Admin access required' });
    // }
    
    // For now, allow all requests
    next();
  } catch (error) {
    console.error('RBAC error:', error);
    res.status(403).json({ error: 'Forbidden' });
  }
}
