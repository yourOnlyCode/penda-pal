import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect()
    const userCount = await prisma.user.count()
    
    return NextResponse.json({
      success: true,
      database: 'connected',
      userCount,
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        nextAuthUrl: process.env.NEXTAUTH_URL,
      },
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message,
      stack: error?.stack,
      code: error?.code,
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        nextAuthUrl: process.env.NEXTAUTH_URL,
      },
    }, { status: 500 })
  }
}
