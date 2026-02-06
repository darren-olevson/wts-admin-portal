import { Request, Response, NextFunction } from 'express';
import * as stytch from '@stytch/node';

// TODO: Initialize Stytch client with environment variables
// const stytchClient = new stytch.Client(
//   process.env.STYTCH_PROJECT_ID!,
//   process.env.STYTCH_SECRET!
// );

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // TODO: Implement Stytch authentication middleware
  // For now, allow all requests (development only)
  next();
};

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // TODO: Implement admin role check
  // For now, allow all requests (development only)
  next();
};
