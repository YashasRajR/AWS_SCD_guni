import { Router } from 'express';
import { RegistrationController } from './registration.controller.js';

const router = Router();

router.post('/', RegistrationController.register);
router.get('/:id', RegistrationController.getById);

export default router;
