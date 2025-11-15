import { z } from 'zod';

export const workbookSchema = z.object({
  id: z.uuid(),
  name: z.string().max(48),
  createdAt: z.iso.datetime(),
});

export const debtSchema = z.object({
  id: z.uuid(),
  workbookId: z.uuid(),
  name: z.string().max(48),
  type: z.enum(['auto', 'home', 'credit', 'school', 'personal', 'other']),
  rate: z.string(),
  balance: z.string(),
  minPayment: z.string(),
});
