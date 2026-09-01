import { Request, Response, NextFunction } from 'express';
import { RegistrationService } from './registration.service.ts';
import { registrationSchema } from '@scd/validation';

export class RegistrationController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = registrationSchema.parse(req.body);
      const result = await RegistrationService.registerAttendee(validatedData);
      res.status(201).json({
        success: true,
        data: result,
        message: result.paymentRequired
          ? 'Registration created, payment required'
          : 'Registration confirmed and ticket issued'
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const registration = await RegistrationService.getRegistrationDetails(id);
      if (!registration) {
        return res.status(404).json({ success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Registration not found' } });
      }
      res.json({ success: true, data: registration });
    } catch (error) {
      next(error);
    }
  }
}
