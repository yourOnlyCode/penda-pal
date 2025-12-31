import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { deductPendaCoins, getPendaCoins } from '@/lib/pendaCoins'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await req.json()
    const { villageId, gridX, gridZ } = body
    
    if (!villageId || gridX === undefined || gridZ === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Get user to check verification status and coin balance
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isVerified: true, pendaCoins: true }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    const maxLots = user.isVerified ? 3 : 1
    
    // Check how many lots the user already owns
    const ownedLots = await prisma.lot.count({
      where: { ownerId: session.user.id }
    })
    
    if (ownedLots >= maxLots) {
      return NextResponse.json({ 
        error: `You've reached your building limit (${maxLots} ${maxLots === 1 ? 'house' : 'houses'})` 
      }, { status: 400 })
    }
    
    // Check if lot exists and is available
    const existingLot = await prisma.lot.findFirst({
      where: {
        villageId,
        gridX,
        gridZ
      }
    })
    
    // Get village name from existing lot or fetch from village data
    let villageName = 'Unknown Village'
    if (existingLot?.villageName) {
      villageName = existingLot.villageName
    } else {
      // Try to get from another lot in the same village
      const otherLot = await prisma.lot.findFirst({
        where: { villageId },
        select: { villageName: true }
      })
      if (otherLot?.villageName) {
        villageName = otherLot.villageName
      }
    }
    
    if (existingLot) {
      if (existingLot.ownerId) {
        return NextResponse.json({ error: 'Lot is already owned' }, { status: 400 })
      }
      if (existingLot.isRoad) {
        return NextResponse.json({ error: 'Cannot build on roads' }, { status: 400 })
      }
      if (existingLot.isPathway) {
        return NextResponse.json({ error: 'Cannot build on pathways' }, { status: 400 })
      }
      if (existingLot.isPark) {
        return NextResponse.json({ error: 'Cannot build on parks' }, { status: 400 })
      }
      
      // Check if user has enough coins
      const cost = existingLot.cost
      if (user.pendaCoins < cost) {
        return NextResponse.json({ 
          error: `Insufficient Penda Coins. You have ${user.pendaCoins}, but need ${cost}` 
        }, { status: 400 })
      }
      
      // Deduct coins
      const newBalance = await deductPendaCoins(
        session.user.id,
        cost,
        `Purchased lot at ${existingLot.address}`
      )
      
      if (newBalance === null) {
        return NextResponse.json({ 
          error: 'Insufficient Penda Coins' 
        }, { status: 400 })
      }
      
      // Update existing lot
      const lot = await prisma.lot.update({
        where: { id: existingLot.id },
        data: {
          ownerId: session.user.id,
          houseType: 'basic',
          floorCount: 1
        }
      })
      
      return NextResponse.json({ success: true, lot, newBalance })
    }
    
    // Generate address and cost (matching client-side generation)
    const streetNames = [
      'Main St', 'Oak Ave', 'Elm Blvd', 'Pine Rd', 'Maple Dr',
      'Cedar Ln', 'Birch Way', 'Willow Ct', 'Ash St', 'Spruce Ave'
    ]
    const street = streetNames[gridZ % streetNames.length]
    const number = (gridX + 1) * 10 + (gridZ % 10)
    const address = `${number} ${street}, ${villageName}`
    
    // Calculate cost (matching client-side calculation)
    const GRID_SIZE = 7
    const baseCost = 100
    const centerDistance = Math.sqrt(
      Math.pow(gridX - GRID_SIZE / 2, 2) + Math.pow(gridZ - GRID_SIZE / 2, 2)
    )
    const locationMultiplier = 1 + (GRID_SIZE / 2 - centerDistance) / GRID_SIZE * 0.5
    const cost = Math.floor(baseCost * locationMultiplier)
    
    // Check if this is an apartment zone (10% chance, deterministic based on position)
    // Using a simple hash for deterministic apartment zones
    const hash = (gridX * 31 + gridZ * 17) % 100
    const isApartmentZone = hash < 10
    
    // Check if user has enough coins
    if (user.pendaCoins < cost) {
      return NextResponse.json({ 
        error: `Insufficient Penda Coins. You have ${user.pendaCoins}, but need ${cost}` 
      }, { status: 400 })
    }
    
    // Deduct coins
    const newBalance = await deductPendaCoins(
      session.user.id,
      cost,
      `Purchased lot at ${address}`
    )
    
    if (newBalance === null) {
      return NextResponse.json({ 
        error: 'Insufficient Penda Coins' 
      }, { status: 400 })
    }
    
    // Create new lot
    const lot = await prisma.lot.create({
      data: {
        villageId,
        villageName,
        gridX,
        gridZ,
        address,
        cost,
        ownerId: session.user.id,
        houseType: 'basic',
        floorCount: 1,
        isRoad: false,
        isPathway: false,
        isPark: false,
        isApartmentZone
      }
    })
    
    return NextResponse.json({ success: true, lot, newBalance })
  } catch (error) {
    console.error('Error purchasing lot:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

