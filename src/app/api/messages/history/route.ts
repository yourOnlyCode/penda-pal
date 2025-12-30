import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const penpalId = searchParams.get('penpalId')

    if (!penpalId) {
      return NextResponse.json({ error: 'penpalId is required' }, { status: 400 })
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
      return NextResponse.json({ error: 'Penpal relationship not found' }, { status: 404 })
    }

    // Get messages for this penpal (for activity tracking only)
    const messages = await prisma.message.findMany({
      where: {
        penpalId: penpalId,
        senderId: session.user.id, // Only messages sent by current user for activity calendar
      },
      select: {
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ messages })
  } catch (error: any) {
    console.error('Get message history error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

