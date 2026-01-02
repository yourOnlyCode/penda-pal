import NextAuth from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const handler = NextAuth(authOptions)

export async function GET(req: Request) {
  return await handler(req)
}

export async function POST(req: Request) {
  return await handler(req)
}
