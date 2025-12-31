import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

const GRID_SIZE = 7

// Generate address (matching client-side, with village name)
function generateAddress(x: number, z: number, villageName: string): string {
  const streetNames = [
    'Main St', 'Oak Ave', 'Elm Blvd', 'Pine Rd', 'Maple Dr',
    'Cedar Ln', 'Birch Way', 'Willow Ct', 'Ash St', 'Spruce Ave'
  ]
  const street = streetNames[z % streetNames.length]
  const number = (x + 1) * 10 + (z % 10)
  return `${number} ${street}, ${villageName}`
}

// Generate lot cost (matching client-side)
function generateLotCost(x: number, z: number, isApartmentZone: boolean): number {
  const baseCost = 100
  const centerDistance = Math.sqrt(
    Math.pow(x - GRID_SIZE / 2, 2) + Math.pow(z - GRID_SIZE / 2, 2)
  )
  const locationMultiplier = 1 + (GRID_SIZE / 2 - centerDistance) / GRID_SIZE * 0.5
  const apartmentMultiplier = isApartmentZone ? 1.5 : 1
  return Math.floor(baseCost * locationMultiplier * apartmentMultiplier)
}

// Generate a seed from village ID
function villageIdToSeed(villageId: string): number {
  let hash = 0
  for (let i = 0; i < villageId.length; i++) {
    const char = villageId.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

// Generate roads (matching client-side) - only 1 road per village, unique per village
function generateRoads(villageId: string): Set<string> {
  const roads = new Set<string>()
  const seed = villageIdToSeed(villageId)
  let currentSeed = seed
  
  // Simple seeded random
  const rng = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280
    return currentSeed / 233280
  }
  
  // Collect potential road lanes
  const horizontalLanes: number[] = []
  const verticalLanes: number[] = []
  
  for (let i = 0; i < GRID_SIZE; i++) {
    if (rng() < 0.4) {
      horizontalLanes.push(i)
    }
    if (rng() < 0.4) {
      verticalLanes.push(i)
    }
  }
  
  // Only 1 road total - randomly choose horizontal or vertical
  const allLanes = [
    ...horizontalLanes.map(i => ({ type: 'h', index: i })),
    ...verticalLanes.map(i => ({ type: 'v', index: i }))
  ]
  
  if (allLanes.length > 0) {
    // Randomly select one lane
    const selectedLane = allLanes[Math.floor(rng() * allLanes.length)]
    
    if (selectedLane.type === 'h') {
      // Horizontal road
      for (let x = 0; x < GRID_SIZE; x++) {
        roads.add(`${x},${selectedLane.index}`)
      }
    } else {
      // Vertical road
      for (let z = 0; z < GRID_SIZE; z++) {
        roads.add(`${selectedLane.index},${z}`)
      }
    }
  } else {
    // Fallback: create a road in the middle if no lanes were generated
    const middle = Math.floor(GRID_SIZE / 2)
    if (rng() < 0.5) {
      // Horizontal
      for (let x = 0; x < GRID_SIZE; x++) {
        roads.add(`${x},${middle}`)
      }
    } else {
      // Vertical
      for (let z = 0; z < GRID_SIZE; z++) {
        roads.add(`${middle},${z}`)
      }
    }
  }
  
  return roads
}

// Generate pathways that wind between blocks (cozy village feel)
function generatePathways(villageId: string, roads: Set<string>): Set<string> {
  const pathways = new Set<string>()
  const seed = villageIdToSeed(villageId) + 12345 // Different seed for pathways
  let currentSeed = seed
  
  const rng = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280
    return currentSeed / 233280
  }
  
  // Create pathways that connect blocks, avoiding main roads
  for (let x = 1; x < GRID_SIZE - 1; x++) {
    for (let z = 1; z < GRID_SIZE - 1; z++) {
      const key = `${x},${z}`
      
      // Skip if it's already a road
      if (roads.has(key)) continue
      
      // Create pathways with some probability, creating organic connections
      const neighbors = [
        `${x-1},${z}`, `${x+1},${z}`, // horizontal neighbors
        `${x},${z-1}`, `${x},${z+1}`, // vertical neighbors
        `${x-1},${z-1}`, `${x+1},${z+1}`, // diagonal neighbors
        `${x-1},${z+1}`, `${x+1},${z-1}`  // other diagonal
      ]
      
      // Count how many neighbors are roads or pathways
      const connectedNeighbors = neighbors.filter(n => roads.has(n) || pathways.has(n)).length
      
      // Create pathways that connect to existing roads/pathways
      if (connectedNeighbors > 0 && rng() < 0.15) {
        pathways.add(key)
      }
      
      // Also create some standalone pathways in clusters
      if (rng() < 0.08) {
        pathways.add(key)
      }
    }
  }
  
  // Create some winding paths that follow patterns
  const pathPatterns = [
    // Horizontal winding paths
    () => {
      for (let z = 2; z < GRID_SIZE - 2; z += 3) {
        for (let x = 1; x < GRID_SIZE - 1; x++) {
          const key = `${x},${z}`
          if (!roads.has(key) && rng() < 0.4) {
            pathways.add(key)
          }
        }
      }
    },
    // Vertical winding paths
    () => {
      for (let x = 2; x < GRID_SIZE - 2; x += 3) {
        for (let z = 1; z < GRID_SIZE - 1; z++) {
          const key = `${x},${z}`
          if (!roads.has(key) && rng() < 0.4) {
            pathways.add(key)
          }
        }
      }
    },
    // Diagonal paths
    () => {
      for (let offset = 0; offset < GRID_SIZE; offset++) {
        const x = offset
        const z = offset
        if (x < GRID_SIZE - 1 && z < GRID_SIZE - 1) {
          const key = `${x},${z}`
          if (!roads.has(key) && rng() < 0.3) {
            pathways.add(key)
          }
        }
      }
    }
  ]
  
  // Select 1 path pattern based on village seed (smaller villages = fewer patterns)
  const patternIndex = Math.floor(rng() * pathPatterns.length)
  pathPatterns[patternIndex]()
  
  return pathways
}

// Generate parks (green spaces, cannot be built on) - matching client-side
function generateParks(villageId: string, roads: Set<string>, pathways: Set<string>): Set<string> {
  const parks = new Set<string>()
  const seed = villageIdToSeed(villageId) + 67890 // Different seed for parks
  let currentSeed = seed
  
  const rng = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280
    return currentSeed / 233280
  }
  
  // Parks should be in clusters (2x2) to create nice green spaces
  // They should avoid roads, pathways, and be spread throughout the village
  
  // Find valid positions for park clusters (not on roads/pathways, within bounds)
  const clusterPositions: Array<{x: number, z: number, size: number}> = []
  
  // Try 2x2 clusters
  for (let x = 0; x < GRID_SIZE - 1; x++) {
    for (let z = 0; z < GRID_SIZE - 1; z++) {
      const key = `${x},${z}`
      if (!roads.has(key) && !pathways.has(key) &&
          !roads.has(`${x+1},${z}`) && !pathways.has(`${x+1},${z}`) && 
          !roads.has(`${x},${z+1}`) && !pathways.has(`${x},${z+1}`) && 
          !roads.has(`${x+1},${z+1}`) && !pathways.has(`${x+1},${z+1}`)) {
        clusterPositions.push({ x, z, size: 2 })
      }
    }
  }
  
  // Select 1-2 park clusters per village (smaller villages = fewer parks)
  const numParks = Math.min(Math.floor(clusterPositions.length * 0.1), 2)
  const selectedParks: Array<{x: number, z: number, size: number}> = []
  
  // Shuffle and select
  for (let i = clusterPositions.length - 1; i > 0 && selectedParks.length < numParks; i--) {
    const j = Math.floor(rng() * (i + 1))
    const temp = clusterPositions[i]
    clusterPositions[i] = clusterPositions[j]
    clusterPositions[j] = temp
    
    const candidate = clusterPositions[i]
    // Check if it overlaps with existing parks
    const overlaps = selectedParks.some(park => 
      Math.abs(park.x - candidate.x) < 3 && Math.abs(park.z - candidate.z) < 3
    )
    
    if (!overlaps) {
      selectedParks.push(candidate)
    }
  }
  
  // Mark all cells in selected parks
  selectedParks.forEach(park => {
    for (let dx = 0; dx < park.size; dx++) {
      for (let dz = 0; dz < park.size; dz++) {
        const px = park.x + dx
        const pz = park.z + dz
        if (px < GRID_SIZE && pz < GRID_SIZE) {
          const key = `${px},${pz}`
          if (!roads.has(key) && !pathways.has(key)) {
            parks.add(key)
          }
        }
      }
    }
  })
  
  return parks
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await req.json()
    const { villageId, villageName } = body
    
    if (!villageId || !villageName) {
      return NextResponse.json({ error: 'Missing villageId or villageName' }, { status: 400 })
    }
    
    // Check if lots already exist for this village
    const existingLots = await prisma.lot.count({
      where: { villageId }
    })
    
    if (existingLots > 0) {
      return NextResponse.json({ message: 'Lots already initialized', count: existingLots })
    }
    
    // Generate roads, pathways, parks, and apartment zones
    const roads = generateRoads(villageId)
    const pathways = generatePathways(villageId, roads)
    const parks = generateParks(villageId, roads, pathways)
    const apartmentZones = new Set<string>()
    let seed = villageIdToSeed(villageId) + 54321
    
    const rng = () => {
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }
    
    // Create 2x2 apartment zone clusters
    const clusterPositions: Array<{x: number, z: number}> = []
    
    // Find valid positions for 2x2 clusters (not on roads/pathways/parks, within bounds)
    for (let x = 0; x < GRID_SIZE - 1; x++) {
      for (let z = 0; z < GRID_SIZE - 1; z++) {
        const key = `${x},${z}`
        if (!roads.has(key) && !pathways.has(key) && !parks.has(key) &&
            !roads.has(`${x+1},${z}`) && !pathways.has(`${x+1},${z}`) && !parks.has(`${x+1},${z}`) && 
            !roads.has(`${x},${z+1}`) && !pathways.has(`${x},${z+1}`) && !parks.has(`${x},${z+1}`) && 
            !roads.has(`${x+1},${z+1}`) && !pathways.has(`${x+1},${z+1}`) && !parks.has(`${x+1},${z+1}`)) {
          clusterPositions.push({ x, z })
        }
      }
    }
    
    // Select some clusters (about 2-3 clusters for smaller villages)
    const numClusters = Math.min(Math.floor(clusterPositions.length * 0.15), 3)
    const selectedClusters: Array<{x: number, z: number}> = []
    
    // Shuffle and select
    for (let i = clusterPositions.length - 1; i > 0 && selectedClusters.length < numClusters; i--) {
      const j = Math.floor(rng() * (i + 1))
      const temp = clusterPositions[i]
      clusterPositions[i] = clusterPositions[j]
      clusterPositions[j] = temp
      
      const candidate = clusterPositions[i]
      // Check if it overlaps with existing clusters
      const overlaps = selectedClusters.some(cluster => 
        Math.abs(cluster.x - candidate.x) < 3 && Math.abs(cluster.z - candidate.z) < 3
      )
      
      if (!overlaps) {
        selectedClusters.push(candidate)
      }
    }
    
    // Mark all cells in selected clusters as apartment zones
    selectedClusters.forEach(cluster => {
      apartmentZones.add(`${cluster.x},${cluster.z}`)
      apartmentZones.add(`${cluster.x+1},${cluster.z}`)
      apartmentZones.add(`${cluster.x},${cluster.z+1}`)
      apartmentZones.add(`${cluster.x+1},${cluster.z+1}`)
    })
    
    // Create all lots
    const lots = []
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        const key = `${x},${z}`
        const isRoad = roads.has(key)
        const isPathway = pathways.has(key)
        const isPark = parks.has(key)
        const isApartmentZone = apartmentZones.has(key)
        
        lots.push({
          villageId,
          villageName,
          gridX: x,
          gridZ: z,
          address: generateAddress(x, z, villageName),
          cost: generateLotCost(x, z, isApartmentZone),
          isRoad,
          isPathway,
          isPark,
          isApartmentZone,
          floorCount: 1
        })
      }
    }
    
    // Batch create lots
    await prisma.lot.createMany({
      data: lots
    })
    
    return NextResponse.json({ success: true, count: lots.length })
  } catch (error) {
    console.error('Error initializing lots:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

