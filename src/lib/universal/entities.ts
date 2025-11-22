import { z } from 'zod';

const timestampField = z
  .string()
  .transform((val) => new Date(val).toISOString());

export const workbookSchema = z.object({
  id: z.uuid(),
  name: z.string().max(48),
  createdAt: timestampField,
  updatedAt: timestampField,
});

export const debtSchema = z.object({
  id: z.uuid(),
  workbookId: z.uuid(),
  name: z.string().max(48),
  type: z.enum(['auto', 'home', 'credit', 'school', 'personal', 'other']),
  rate: z.string(),
  balance: z.string(),
  minPayment: z.string(),
  createdAt: timestampField,
  updatedAt: timestampField,
});
