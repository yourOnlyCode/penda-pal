import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const envCheck = {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    databaseUrlPreview: process.env.DATABASE_URL 
      ? `${process.env.DATABASE_URL.substring(0, 20)}...` 
      : 'NOT SET',
  }

  try {
    // Test database connection with timeout
    const connectPromise = prisma.$connect()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
    )
    
    await Promise.race([connectPromise, timeoutPromise])
    
    const userCount = await prisma.user.count()
    
    return NextResponse.json({
      success: true,
      database: 'connected',
      userCount,
      env: envCheck,
    })
  } catch (error: any) {
    // Always return 200 so we can see the error details
    return NextResponse.json({
      success: false,
      error: {
        message: error?.message || 'Unknown error',
        name: error?.name,
        code: error?.code,
        meta: error?.meta,
      },
      env: envCheck,
      hint: error?.code === 'P1001' 
        ? 'Database connection failed. Check DATABASE_URL format. Use connection pooler (port 6543) for Supabase.'
        : error?.code === 'P1017'
        ? 'Database connection closed. Check if DATABASE_URL is correct.'
        : 'Check Vercel function logs for more details.',
    }, { status: 200 }) // Return 200 so error details are visible
  }
}
