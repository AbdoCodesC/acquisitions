import { z } from 'zod';

export const userIdSchema = z.object({
  params: z.object({
    id: z
      .string()
      .regex(/^\d+$/, 'id must be a numeric string')
      .transform(val => Number(val))
      .refine(val => Number.isInteger(val) && val > 0, 'id must be a positive integer'),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z
      .string()
      .regex(/^\d+$/, 'id must be a numeric string')
      .transform(val => Number(val))
      .refine(val => Number.isInteger(val) && val > 0, 'id must be a positive integer'),
  }),
  body: z
    .object({
      name: z.string().min(2).max(255).optional(),
      email: z.string().email().max(255).trim().toLowerCase().optional(),
      password: z.string().min(8).max(128).optional(),
      role: z.enum(['user', 'admin']).optional(),
    })
    .refine(data => Object.keys(data).length > 0, {
      message: 'At least one field must be provided to update',
      path: ['body'],
    }),
});
