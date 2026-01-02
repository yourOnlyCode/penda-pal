import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

// Get all neighbors (users in the same village)
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

    // Get current user's lot in this village
    const userLot = await prisma.lot.findFirst({
      where: {
        villageId,
        ownerId: session.user.id
      }
    })

    if (!userLot) {
      return NextResponse.json({ error: 'You do not own a lot in this village' }, { status: 400 })
    }

    // Get all other users who own lots in this village
    const neighborLots = await prisma.lot.findMany({
      where: {
        villageId,
        AND: [
          { ownerId: { not: null } },
          { ownerId: { not: session.user.id } }
        ]
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    })

    // Format neighbors with their addresses
    const neighbors = neighborLots
      .filter(lot => lot.owner !== null)
      .map(lot => ({
        id: lot.owner!.id,
        name: lot.owner!.name || 'Anonymous',
        image: lot.owner!.image,
        address: lot.address
      }))

    return NextResponse.json({ neighbors })
  } catch (error) {
    console.error('Error fetching neighbors:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

