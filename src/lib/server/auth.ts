import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { reactStartCookies } from 'better-auth/react-start'
import { db } from './db'

export const auth = betterAuth({
  plugins: [reactStartCookies()],
  database: prismaAdapter(db, {
    provider: 'postgresql',
  }),
  advanced: {
    database: { generateId: false },
  },
  emailAndPassword: {
    enabled: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  secret: process.env.BETTER_AUTH_SECRET as string,
  baseURL: process.env.BETTER_AUTH_URL as string,
})
