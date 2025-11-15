import { auth } from '@/lib/server/auth'
import { createFileRoute } from '@tanstack/react-router'

// Proxy-auth pattern based on ElectricSQL example
// Ref: https://github.com/electric-sql/electric/blob/main/examples/proxy-auth/app/shape-proxy/route.ts

export const Route = createFileRoute('/api/electric')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        // Authenticate via BetterAuth cookies
        const session = await auth.api.getSession({ headers: request.headers })

        if (!session?.user?.id) {
          return new Response(JSON.stringify({ error: 'Not authenticated' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const userId = session.user.id
        const url = new URL(request.url)

        // Required: which table to stream (only workbooks allowed)
        const table = url.searchParams.get('table')?.trim()
        const allowedTables = ['workbooks']

        if (!table || !allowedTables.includes(table)) {
          return new Response(
            JSON.stringify({ error: 'Invalid or missing table.' }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }

        // Build WHERE SQL to filter by ownerId
        const whereSql = `"ownerId" = '${userId}'`

        // Proxy to Electric server
        const electricUrl = process.env.ELECTRIC_URL || 'http://localhost:4000'
        const upstreamUrl = new URL('/v1/shape', electricUrl)

        // Forward all query params from the client, except 'table' (we'll set it)
        for (const [key, value] of url.searchParams.entries()) {
          if (key === 'table') continue
          upstreamUrl.searchParams.set(key, value)
        }

        // Set the table and WHERE clause
        upstreamUrl.searchParams.set('table', table)
        upstreamUrl.searchParams.set('where', whereSql)

        console.log('electric-proxy', {
          userId,
          table,
          where: whereSql,
          url: upstreamUrl.toString(),
        })

        try {
          const upstream = await fetch(upstreamUrl.toString(), {
            method: 'GET',
          })

          // Copy headers from upstream, with modifications
          const headers = new Headers(upstream.headers)

          // Remove any upstream CORS headers to avoid conflicts
          headers.delete('access-control-allow-origin')
          headers.delete('access-control-allow-credentials')

          // Ensure caches vary by Cookie since auth is cookie-based
          headers.set('Vary', 'Cookie')

          // Return the streaming response
          return new Response(upstream.body, {
            status: upstream.status,
            headers,
          })
        } catch (error) {
          console.error('Electric proxy error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to connect to Electric server' }),
            {
              status: 502,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }
      },
    },
  },
})
