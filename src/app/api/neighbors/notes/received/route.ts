import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

// Get received neighbor notes
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

    // Get all notes received by the user in this village
    const notes = await prisma.neighborNote.findMany({
      where: {
        receiverId: session.user.id,
        villageId
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ notes })
  } catch (error) {
    console.error('Error fetching received notes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

