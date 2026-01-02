import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { findAndMatchPenpal } from '@/lib/matching'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await req.json()

    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if user already has an active penpal
    const existingPenpal = await prisma.penpal.findFirst({
      where: {
        OR: [
          { user1Id: userId, status: 'active' },
          { user2Id: userId, status: 'active' },
        ],
      },
    })

    if (existingPenpal) {
      return NextResponse.json(
        { error: 'You already have an active penpal' },
        { status: 400 }
      )
    }

    // Try to find and match a penpal (heavily considers interests)
    const penpal = await findAndMatchPenpal(userId)

    if (penpal) {
      return NextResponse.json({ penpal, matched: true })
    }

    // If no match found, add to waitlist
    await prisma.waitlist.upsert({
      where: { userId },
      create: {
        userId,
        isMinor: false, // You might want to get this from user data
      },
      update: {},
    })

    return NextResponse.json({ matched: false, waitlist: true })
  } catch (error: any) {
    console.error('Request penpal error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

