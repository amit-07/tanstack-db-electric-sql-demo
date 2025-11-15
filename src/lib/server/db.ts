import { PrismaClient } from '@/generated/prisma'

export const db = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})
