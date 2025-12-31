import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { awardPendaCoins } from '@/lib/pendaCoins'
// TODO: Add content moderation
// import { checkContent } from '@/lib/moderation'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { penpalId, content } = await req.json()

    if (!content || !penpalId) {
      return NextResponse.json({ error: 'Missing content or penpalId' }, { status: 400 })
    }

    // Verify user is part of the penpal relationship
    const penpal = await prisma.penpal.findFirst({
      where: {
        id: penpalId,
        OR: [
          { user1Id: session.user.id },
          { user2Id: session.user.id },
        ],
        status: 'active',
      },
    })

    if (!penpal) {
      return NextResponse.json({ error: 'Penpal relationship not found or inactive' }, { status: 404 })
    }

    // Check for "Slow Mode" - 1 message per day limitation
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const messageCount = await prisma.message.count({
      where: {
        penpalId: penpalId,
        senderId: session.user.id,
        createdAt: {
          gte: today,
        },
      },
    })

    if (messageCount > 0) {
      return NextResponse.json(
        { error: 'You have already sent your daily letter! Come back tomorrow.' },
        { status: 429 }
      )
    }

    // TODO: Implement OpenAI moderation check here
    // const isFlagged = await checkContent(content)
    // if (isFlagged) return error...

    const message = await prisma.message.create({
      data: {
        content,
        penpalId,
        senderId: session.user.id,
        moderationStatus: 'approved', // Defaulting to approved for now
      },
    })

    // Award coins for writing to penpal
    const coinsAwarded = 10 // Award 10 coins for writing to penpal
    await awardPendaCoins(session.user.id, coinsAwarded, 'Writing to penpal')

    return NextResponse.json({ message, coinsAwarded })
  } catch (error: any) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

