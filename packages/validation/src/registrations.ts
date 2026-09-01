import { z } from 'zod';

export const registrationSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  university: z.string().min(2, 'University name is required'),
  department: z.string().min(2, 'Department name is required'),
  year: z.string().min(1, 'Academic year is required'),
  registrationType: z.enum(['STUDENT', 'PROFESSIONAL', 'VIP', 'VOLUNTEER']).default('STUDENT'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

export type RegistrationSchemaType = z.infer<typeof registrationSchema>;
