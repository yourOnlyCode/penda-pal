import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { awardPendaCoins } from '@/lib/pendaCoins'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = { userId: session.user.id }
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const statuses = await prisma.dailyStatus.findMany({
      where,
      orderBy: { date: 'desc' },
    })

    return NextResponse.json({ statuses })
  } catch (error: any) {
    console.error('Get daily status error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content, mediaUrl, mediaType } = await req.json()

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Get today's date (start of day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check if status already exists for today
    const existingStatus = await prisma.dailyStatus.findUnique({
      where: {
        userId_date: {
          userId: session.user.id,
          date: today,
        },
      },
    })

    // Upsert: update if exists for today, create if not
    const status = await prisma.dailyStatus.upsert({
      where: {
        userId_date: {
          userId: session.user.id,
          date: today,
        },
      },
      update: {
        content,
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
      },
      create: {
        userId: session.user.id,
        content,
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        date: today,
      },
    })

    // Award coins if this is a new status (not an update)
    let coinsAwarded = 0
    if (!existingStatus) {
      coinsAwarded = 5 // Award 5 coins for updating status
      await awardPendaCoins(session.user.id, coinsAwarded, 'Status update')
    }

    return NextResponse.json({ status, coinsAwarded })
  } catch (error: any) {
    console.error('Create daily status error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

