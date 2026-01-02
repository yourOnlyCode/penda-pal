import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reportedUserId, reason, penpalId } = await req.json()

    if (!reportedUserId || !reason || !penpalId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
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
      return NextResponse.json(
        { error: 'Penpal relationship not found' },
        { status: 404 }
      )
    }

    // Verify the reported user is the other user in the penpal relationship
    const isReportedUserInPenpal =
      penpal.user1Id === reportedUserId || penpal.user2Id === reportedUserId

    if (!isReportedUserInPenpal) {
      return NextResponse.json(
        { error: 'Reported user is not your penpal' },
        { status: 400 }
      )
    }

    // Create report
    await prisma.report.create({
      data: {
        reporterId: session.user.id,
        reportedId: reportedUserId,
        penpalId: penpalId,
        reason: reason,
        status: 'pending',
      },
    })

    return NextResponse.json({
      message: 'Report submitted successfully. Our team will review it.',
    })
  } catch (error: any) {
    console.error('Report penpal error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
