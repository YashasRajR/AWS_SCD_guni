import { Router } from 'express';
import registrationRoutes from '../modules/registrations/registration.routes.js';

const router = Router();

router.use('/registrations', registrationRoutes);

export default router;
