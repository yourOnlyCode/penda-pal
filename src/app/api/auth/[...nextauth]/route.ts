import NextAuth from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const handler = NextAuth(authOptions)

export async function GET(req: Request) {
  try {
    return await handler(req)
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
    return await handler(req)
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
