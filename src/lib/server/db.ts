import { PrismaClient } from '@/generated/prisma/client';

export type {
  Debt as DebtEntity,
  Workbook as WorkbookEntity,
} from '@/generated/prisma/client';

export const db = new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'info', 'warn', 'error']
      : ['warn', 'error'],
});
