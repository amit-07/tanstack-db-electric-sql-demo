import { z } from 'zod';

const timestampField = z
  .string()
  .transform((val) => new Date(val).toISOString());

export const workbookSchema = z.object({
  id: z.uuidv7(),
  name: z.string().max(48),
  monthlyPayment: z.string(),
  strategy: z.enum(['avalanche', 'snowball']),
  createdAt: timestampField,
  updatedAt: timestampField,
});

export const debtSchema = z.object({
  id: z.uuidv7(),
  workbookId: z.uuidv7(),
  name: z.string().max(48),
  type: z.enum(['auto', 'home', 'credit', 'school', 'personal', 'other']),
  rate: z.string(),
  balance: z.string(),
  minPayment: z.string(),
  createdAt: timestampField,
  updatedAt: timestampField,
});
