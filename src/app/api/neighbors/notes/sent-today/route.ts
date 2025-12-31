import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// Get neighbors that already received a note today
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const villageId = searchParams.get('villageId')

    if (!villageId) {
      return NextResponse.json({ error: 'villageId is required' }, { status: 400 })
    }

    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get all notes sent today by this user
    const notesSentToday = await prisma.neighborNote.findMany({
      where: {
        senderId: session.user.id,
        villageId,
        date: {
          gte: today,
          lt: tomorrow
        }
      },
      select: {
        receiverId: true
      }
    })

    const receiverIds = notesSentToday.map(note => note.receiverId)

    return NextResponse.json({ receiverIds })
  } catch (error) {
    console.error('Error fetching sent notes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

