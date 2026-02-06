import { Request, Response, NextFunction } from 'express';
// import { StytchClient } from '@stytch/node';

/**
 * Authentication middleware using Stytch
 * TODO: Implement actual Stytch authentication
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // TODO: Extract and verify Stytch session token
    // const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    // if (!sessionToken) {
    //   return res.status(401).json({ error: 'Unauthorized' });
    // }
    // 
    // const stytchClient = new StytchClient(
    //   process.env.STYTCH_PROJECT_ID!,
    //   process.env.STYTCH_SECRET!
    // );
    // 
    // const session = await stytchClient.sessions.authenticate({ session_token: sessionToken });
    // req.user = session.user;
    
    // For now, skip authentication
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
}
