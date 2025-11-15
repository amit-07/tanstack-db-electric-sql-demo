import { PrismaClient } from '@/generated/prisma/client'

export const db = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})
