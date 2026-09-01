import { Router } from 'express';

// Route architecture reserved for admin user-management (list/suspend/
// change role) in a later phase. Intentionally not mounted with any
// endpoints yet — see modules/attendees for the current /me/* routes.
export const usersRouter = Router();
