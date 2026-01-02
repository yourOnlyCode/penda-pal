import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

// Get Rapport stats for a village
export async function GET(
  req: NextRequest,
  { params }: { params: { villageId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { villageId } = params

    // Get current user's rapport
    const userRapport = await prisma.rapport.findUnique({
      where: {
        userId_villageId: {
          userId: session.user.id,
          villageId
        }
      }
    })

    // Get top rapport holders in the village
    const topRapport = await prisma.rapport.findMany({
      where: {
        villageId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        score: 'desc'
      },
      take: 10
    })

    return NextResponse.json({ 
      userRapport: userRapport || { score: 0 },
      topRapport: topRapport.map(r => ({
        userId: r.userId,
        userName: r.user.name || 'Anonymous',
        userImage: r.user.image,
        score: r.score
      }))
    })
  } catch (error) {
    console.error('Error fetching rapport:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

