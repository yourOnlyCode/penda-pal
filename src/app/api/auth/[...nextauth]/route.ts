import NextAuth from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const handler = NextAuth(authOptions)

export async function GET(req: Request) {
  try {
    // NextAuth v4 should handle App Router requests, but we need to ensure
    // the request has the proper structure
    const url = new URL(req.url)
    const pathname = url.pathname
    
    // Extract nextauth segments from pathname (e.g., /api/auth/session -> ['session'])
    const match = pathname.match(/\/api\/auth\/(.+)/)
    const segments = match ? match[1].split('/') : []
    
    // Create a request-like object with query that NextAuth expects
    const requestWithQuery = {
      ...req,
      url: req.url,
      query: {
        nextauth: segments,
        ...Object.fromEntries(url.searchParams.entries()),
      },
      headers: req.headers,
      method: req.method,
    } as any
    
    return await handler(requestWithQuery)
  } catch (error: any) {
    console.error('NextAuth GET error:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      code: error?.code,
      cause: error?.cause,
    })
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error?.message || 'Unknown error',
        ...(process.env.NODE_ENV === 'development' && { stack: error?.stack })
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

export async function POST(req: Request) {
  try {
    // NextAuth v4 should handle App Router requests, but we need to ensure
    // the request has the proper structure
    const url = new URL(req.url)
    const pathname = url.pathname
    
    // Extract nextauth segments from pathname (e.g., /api/auth/callback/credentials -> ['callback', 'credentials'])
    const match = pathname.match(/\/api\/auth\/(.+)/)
    const segments = match ? match[1].split('/') : []
    
    // Create a request-like object with query that NextAuth expects
    const requestWithQuery = {
      ...req,
      url: req.url,
      query: {
        nextauth: segments,
        ...Object.fromEntries(url.searchParams.entries()),
      },
      headers: req.headers,
      method: req.method,
    } as any
    
    return await handler(requestWithQuery)
  } catch (error: any) {
    console.error('NextAuth POST error:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      code: error?.code,
      cause: error?.cause,
    })
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error?.message || 'Unknown error',
        ...(process.env.NODE_ENV === 'development' && { stack: error?.stack })
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
