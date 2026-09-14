import type { AuthenticatedIdentity } from '@scd/types';

declare global {
  namespace Express {
    interface Request {
      /** Set by the authentication middleware once a valid token is verified. */
      identity?: AuthenticatedIdentity;
    }
  }
}

export {};
