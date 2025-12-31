import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { awardPendaCoins } from '@/lib/pendaCoins'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { score } = await req.json()

    if (typeof score !== 'number') {
      return NextResponse.json({ error: 'Invalid score' }, { status: 400 })
    }

    // Get current high score
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { highScore: true },
    })

    // Only update if new score is higher
    if (user && (user.highScore === null || score > user.highScore)) {
      // Check if this is a new global highscore (highest across all players)
      const globalHighScore = await prisma.user.findFirst({
        where: {
          highScore: { not: null }
        },
        orderBy: {
          highScore: 'desc'
        },
        select: {
          highScore: true
        }
      })

      const isGlobalHighScore = !globalHighScore || 
        globalHighScore.highScore === null || 
        score > globalHighScore.highScore

      await prisma.user.update({
        where: { id: session.user.id },
        data: { highScore: score },
      })

      // Award coins if it's a new global highscore
      let coinsAwarded = 0
      if (isGlobalHighScore) {
        coinsAwarded = 100 // Award 100 coins for setting a new global highscore
        await awardPendaCoins(session.user.id, coinsAwarded, 'New global highscore')
      }

      return NextResponse.json({ 
        success: true, 
        newHighScore: true,
        isGlobalHighScore,
        coinsAwarded
      })
    }

    return NextResponse.json({ success: true, newHighScore: false })
  } catch (error: any) {
    console.error('High score save error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

