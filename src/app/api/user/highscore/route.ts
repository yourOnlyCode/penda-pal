import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

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
      await prisma.user.update({
        where: { id: session.user.id },
        data: { highScore: score },
      })
      return NextResponse.json({ success: true, newHighScore: true })
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

