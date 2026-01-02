import NextAuth from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const handler = NextAuth(authOptions)

export async function GET(req: Request) {
  try {
    return await handler(req)
  } catch (error: any) {
    console.error('NextAuth GET error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error?.message }),
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
    console.error('NextAuth POST error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error?.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
