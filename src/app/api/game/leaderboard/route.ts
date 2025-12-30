import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    // Get top 50 users by high score, ordered descending
    const leaderboard = await prisma.user.findMany({
      where: {
        highScore: {
          not: null,
          gt: 0, // Only users with actual scores
        },
      },
      select: {
        id: true,
        name: true,
        highScore: true,
        image: true,
      },
      orderBy: {
        highScore: 'desc',
      },
      take: 50, // Top 50
    })

    return NextResponse.json({ leaderboard })
  } catch (error: any) {
    console.error('Leaderboard fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

