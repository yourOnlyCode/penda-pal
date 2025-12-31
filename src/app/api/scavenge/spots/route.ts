import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import * as THREE from 'three'

const PLANET_RADIUS = 2

// Generate a seed from date (same spots for all users on same day)
function dateToSeed(date: Date): number {
  const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

// Simple seeded random
function seededRandom(seed: number) {
  let currentSeed = seed
  return () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280
    return currentSeed / 233280
  }
}

// Generate random position on sphere
function randomSpherePosition(rng: () => number): { x: number; y: number; z: number } {
  const theta = rng() * Math.PI * 2 // Azimuth
  const phi = Math.acos(2 * rng() - 1) // Elevation
  const radius = PLANET_RADIUS * 1.1 // Slightly above surface
  
  return {
    x: radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.sin(phi) * Math.sin(theta),
    z: radius * Math.cos(phi)
  }
}


// Get or create today's scavenge spots
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Check if spots already exist for today
    let spots = await prisma.scavengeSpot.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow
        }
      },
    })

    // If no spots exist, generate 3 new ones
    if (spots.length === 0) {
      const seed = dateToSeed(today)
      const rng = seededRandom(seed)
      const emojis = ['🔍', '🗺️', '💎', '⭐', '🎁', '🏆']
      
      const newSpots = []
      for (let i = 0; i < 3; i++) {
        const position = randomSpherePosition(rng)
        const emoji = emojis[Math.floor(rng() * emojis.length)]
        
        const spot = await prisma.scavengeSpot.create({
          data: {
            date: today,
            positionX: position.x,
            positionY: position.y,
            positionZ: position.z,
            emoji
          }
        })
        newSpots.push(spot)
      }
      spots = newSpots
    }

    // Format spots
    const formattedSpots = spots.map(spot => ({
      id: spot.id,
      position: {
        x: spot.positionX,
        y: spot.positionY,
        z: spot.positionZ
      },
      emoji: spot.emoji,
      hasAttempted: false // No puzzle functionality for now
    }))

    return NextResponse.json({ spots: formattedSpots })
  } catch (error) {
    console.error('Error fetching scavenge spots:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

