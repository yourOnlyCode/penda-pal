import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { villageId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const villageId = params.villageId
    
    // Fetch all lots for this village
    const lots = await prisma.lot.findMany({
      where: { villageId },
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
    
    // Count user's owned lots
    const userOwnedLots = lots.filter(lot => lot.ownerId === session.user.id).length
    
    return NextResponse.json({ lots, userOwnedLots })
  } catch (error) {
    console.error('Error fetching lots:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

