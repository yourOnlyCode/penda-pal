import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Find the first lot owned by the user to get their home village
    const userLot = await prisma.lot.findFirst({
      where: { ownerId: session.user.id },
      select: { villageId: true }
    })
    
    if (!userLot) {
      return NextResponse.json({ villageId: null })
    }
    
    return NextResponse.json({ villageId: userLot.villageId })
  } catch (error) {
    console.error('Error fetching user home:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

