import { z } from 'zod';

export const workbookSchema = z.object({
  id: z.uuid(),
  name: z.string().max(48),
  createdAt: z.iso.datetime(),
});
