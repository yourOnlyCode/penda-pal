import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { awardPendaCoins, deductPendaCoins } from '@/lib/pendaCoins'

// Send a neighbor note
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { receiverId, villageId, villageName, message, present, pendaCoins } = body

    if (!receiverId || !villageId || !villageName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate pendaCoins is a non-negative number
    const coins = Math.max(0, Math.floor(pendaCoins || 0))

    // Check if sender owns a lot in this village
    const senderLot = await prisma.lot.findFirst({
      where: {
        villageId,
        ownerId: session.user.id
      }
    })

    if (!senderLot) {
      return NextResponse.json({ error: 'You do not own a lot in this village' }, { status: 400 })
    }

    // Check if receiver owns a lot in this village
    const receiverLot = await prisma.lot.findFirst({
      where: {
        villageId,
        ownerId: receiverId
      }
    })

    if (!receiverLot) {
      return NextResponse.json({ error: 'Receiver does not own a lot in this village' }, { status: 400 })
    }

    // Check if sender already sent a note to this receiver today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const existingNote = await prisma.neighborNote.findFirst({
      where: {
        senderId: session.user.id,
        receiverId,
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    if (existingNote) {
      return NextResponse.json({ 
        error: 'You can only send one note per neighbor per day' 
      }, { status: 400 })
    }

    // Check if user has enough penda coins (if sending coins) and deduct them
    if (coins > 0) {
      const currentBalance = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { pendaCoins: true }
      })

      if (!currentBalance || currentBalance.pendaCoins < coins) {
        return NextResponse.json({ 
          error: `Insufficient Penda Coins. You have ${currentBalance?.pendaCoins || 0}, but need ${coins}` 
        }, { status: 400 })
      }

      // Deduct coins from sender
      const newBalance = await deductPendaCoins(
        session.user.id,
        coins,
        `Sent ${coins} Penda Coins to neighbor`
      )

      if (newBalance === null) {
        return NextResponse.json({ 
          error: 'Insufficient Penda Coins' 
        }, { status: 400 })
      }

      // Award coins to receiver
      await awardPendaCoins(
        receiverId,
        coins,
        `Received ${coins} Penda Coins from neighbor`
      )
    }

    // Create the note
    const note = await prisma.neighborNote.create({
      data: {
        senderId: session.user.id,
        receiverId,
        villageId,
        villageName,
        message: message || null,
        present: present || null,
        pendaCoins: coins,
        date: new Date()
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    })

    // Update Rapport for receiver (increase by 1 for receiving a note, +1 for each coin, +2 for present)
    let rapportIncrease = 1 // Base for receiving a note
    if (coins > 0) rapportIncrease += coins
    if (present) rapportIncrease += 2

    await prisma.rapport.upsert({
      where: {
        userId_villageId: {
          userId: receiverId,
          villageId: villageId
        }
      },
      create: {
        userId: receiverId,
        villageId,
        villageName,
        score: rapportIncrease
      },
      update: {
        score: {
          increment: rapportIncrease
        }
      }
    })

    // Award coins to sender for leaving a neighbor note
    const coinsAwarded = 5 // Award 5 coins for leaving a neighbor note
    await awardPendaCoins(session.user.id, coinsAwarded, 'Leaving neighbor note')

    return NextResponse.json({ success: true, note, coinsAwarded })
  } catch (error: any) {
    console.error('Error sending neighbor note:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'You have already sent a note to this neighbor today' 
      }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

