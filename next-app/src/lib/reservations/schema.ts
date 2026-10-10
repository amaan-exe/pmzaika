import { z } from 'zod';

export const createReservationSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(80),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ''))
    .pipe(z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number')),
  email: z.string().trim().email('Enter a valid e-mail address'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the yyyy-mm-dd format'),
  time: z.string().trim().min(1, 'Time is required'),
  guests: z.coerce.number().int().min(1, 'At least 1 guest').max(50, 'For 50+ guests, please call us'),
  seating: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const updateReservationSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'seated', 'cancelled', 'no_show']),
  note: z.string().trim().max(300).optional(),
});

export const listReservationsQuerySchema = z.object({
  status: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  search: z.string().trim().max(80).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});