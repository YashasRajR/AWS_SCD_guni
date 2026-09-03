import type { AuthenticatedIdentity } from '@scd/types';

declare global {
  namespace Express {
    interface Request {
      /** Set by the authentication middleware once a valid token is verified. */
      identity?: AuthenticatedIdentity;
      /** The exact bytes of the request body, captured by express.json({ verify }) in server/app.ts before parsing — needed to verify the payment webhook's HMAC signature, since re-serializing req.body would not reproduce the same bytes the provider signed. */
      rawBody?: Buffer;
    }
  }
}

export {};
