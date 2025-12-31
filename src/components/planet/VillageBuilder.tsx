'use client'

import { useRef, useState, useMemo, Suspense, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { TopRightControls } from '@/components/dashboard/TopRightControls'
import * as THREE from 'three'
import { NeighborNotes } from './NeighborNotes'

// Ensure Three.js is only imported client-side
if (typeof window === 'undefined') {
  // @ts-ignore
  global.THREE = {}
}

interface GridCell {
  x: number
  z: number
  hasHouse: boolean
  houseType?: string
  floorCount?: number
  ownerId?: string
  ownerName?: string
  address: string
  cost: number
  isRoad: boolean
  isPathway: boolean
  isPark: boolean
  isApartmentZone: boolean
}

interface LotDetailsModalProps {
  cell: GridCell | null
  x: number
  z: number
  isOpen: boolean
  onClose: () => void
  onPurchase: (x: number, z: number) => void
  canPurchase: boolean
  userOwnedLots: number
  maxLots: number
  currentUserId?: string
}

interface VillageBuilderProps {
  villageId: string
  villageName: string
  userVerified: boolean
}

const GRID_SIZE = 7 // Smaller, cozier villages
const CELL_SIZE = 0.5
const PADDING = 3 // Grass padding around grid

// Generate address for a lot (globally unique with village name)
function generateAddress(x: number, z: number, villageName: string): string {
  const streetNames = [
    'Main St', 'Oak Ave', 'Elm Blvd', 'Pine Rd', 'Maple Dr',
    'Cedar Ln', 'Birch Way', 'Willow Ct', 'Ash St', 'Spruce Ave'
  ]
  const street = streetNames[z % streetNames.length]
  const number = (x + 1) * 10 + (z % 10)
  return `${number} ${street}, ${villageName}`
}

// Generate lot cost (varies by location)
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

// Generate roads (cannot be built on) - only 1 road per village, unique per village
function generateRoads(villageId: string): Set<string> {
  const roads = new Set<string>()
  const seed = villageIdToSeed(villageId)
  const rng = new SeededRandom(seed)
  
  // Collect potential road lanes
  const horizontalLanes: number[] = []
  const verticalLanes: number[] = []
  
  for (let i = 0; i < GRID_SIZE; i++) {
    if (rng.next() < 0.4) {
      horizontalLanes.push(i)
    }
    if (rng.next() < 0.4) {
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
    const selectedLane = allLanes[Math.floor(rng.next() * allLanes.length)]
    
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
    if (rng.next() < 0.5) {
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
  const rng = new SeededRandom(seed)
  
  // Create pathways that connect blocks, avoiding main roads
  // Pathways are smaller, more organic connections
  
  // Create some diagonal and curved pathways
  for (let x = 1; x < GRID_SIZE - 1; x++) {
    for (let z = 1; z < GRID_SIZE - 1; z++) {
      const key = `${x},${z}`
      
      // Skip if it's already a road
      if (roads.has(key)) continue
      
      // Create pathways with some probability, creating organic connections
      // Pathways tend to connect nearby blocks
      const neighbors = [
        `${x-1},${z}`, `${x+1},${z}`, // horizontal neighbors
        `${x},${z-1}`, `${x},${z+1}`, // vertical neighbors
        `${x-1},${z-1}`, `${x+1},${z+1}`, // diagonal neighbors
        `${x-1},${z+1}`, `${x+1},${z-1}`  // other diagonal
      ]
      
      // Count how many neighbors are roads or pathways
      const connectedNeighbors = neighbors.filter(n => roads.has(n) || pathways.has(n)).length
      
      // Create pathways that connect to existing roads/pathways, creating a network
      if (connectedNeighbors > 0 && rng.next() < 0.15) {
        pathways.add(key)
      }
      
      // Also create some standalone pathways in clusters
      if (rng.next() < 0.08) {
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
          if (!roads.has(key) && rng.next() < 0.4) {
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
          if (!roads.has(key) && rng.next() < 0.4) {
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
          if (!roads.has(key) && rng.next() < 0.3) {
            pathways.add(key)
          }
        }
      }
    }
  ]
  
    // Select 1 path pattern based on village seed (smaller villages = fewer patterns)
    const patternIndex = Math.floor(rng.next() * pathPatterns.length)
    pathPatterns[patternIndex]()
  
  return pathways
}

// Generate parks (green spaces, cannot be built on)
function generateParks(villageId: string, roads: Set<string>, pathways: Set<string>): Set<string> {
  const parks = new Set<string>()
  const seed = villageIdToSeed(villageId) + 67890 // Different seed for parks
  const rng = new SeededRandom(seed)
  
  // Parks should be in clusters (2x2 or 3x3) to create nice green spaces
  // They should avoid roads, pathways, and be spread throughout the village
  
  // Find valid positions for park clusters (not on roads/pathways, within bounds)
  const clusterPositions: Array<{x: number, z: number, size: number}> = []
  
  // Try 2x2 clusters first
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
    const j = Math.floor(rng.next() * (i + 1))
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

// Simple seeded random
class SeededRandom {
  private seed: number
  constructor(seed: number) {
    this.seed = seed
  }
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280
    return this.seed / 233280
  }
}

// Lot Details Modal
function LotDetailsModal({
  cell,
  x,
  z,
  isOpen,
  onClose,
  onPurchase,
  canPurchase,
  userOwnedLots,
  maxLots,
  currentUserId
}: LotDetailsModalProps) {
  if (!isOpen || !cell) return null

  const isOwned = !!cell.ownerId
  const isOwnedByUser = isOwned && cell.ownerId === currentUserId
  const isOwnedByOther = isOwned && cell.ownerId !== currentUserId
  const canBuy = canPurchase && !isOwned && !cell.isRoad && !cell.isPathway && !cell.isPark && userOwnedLots < maxLots

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div 
        className="bg-white dark:bg-zinc-800 rounded-lg p-6 shadow-xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Lot Details
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Address</p>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {cell.address}
            </p>
          </div>

          <div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Cost</p>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {cell.cost} 🪙 Penda Coins
            </p>
          </div>

          {cell.isApartmentZone && (
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                🏢 Apartment Zone - Can build up to 4 floors
              </p>
              {cell.hasHouse && cell.floorCount && cell.floorCount < 4 && (
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Current: {cell.floorCount} floor{cell.floorCount !== 1 ? 's' : ''} (max 4)
                </p>
              )}
            </div>
          )}

          {cell.isRoad && (
            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
              <p className="text-sm text-gray-800 dark:text-gray-200">
                🛣️ Road - Cannot build here
              </p>
            </div>
          )}

          {isOwnedByUser && (
            <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded">
              <p className="text-sm text-green-800 dark:text-green-200">
                🏠 Your House
              </p>
            </div>
          )}

          {isOwnedByOther && (
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Owned by another player
              </p>
            </div>
          )}

          {!canBuy && !isOwned && !cell.isRoad && userOwnedLots >= maxLots && (
            <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded">
              <p className="text-sm text-red-800 dark:text-red-200">
                ⚠️ You've reached your building limit ({maxLots} {maxLots === 1 ? 'house' : 'houses'})
              </p>
            </div>
          )}

          <button
            onClick={() => {
              if (canBuy) {
                onPurchase(x, z)
                onClose()
              }
            }}
            disabled={!canBuy || isOwnedByUser}
            className={`w-full py-2 px-4 rounded font-semibold ${
              canBuy && !isOwnedByUser
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            {isOwnedByUser ? 'Your House' : isOwnedByOther ? 'Already Owned' : cell.isRoad || cell.isPathway || cell.isPark ? 'Cannot Build Here' : userOwnedLots >= maxLots ? 'Building Limit Reached' : 'Purchase Lot'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Grid cell component
function GridCellComponent({ 
  cell, 
  x, 
  z, 
  onCellClick 
}: { 
  cell: GridCell
  x: number
  z: number
  onCellClick: (x: number, z: number) => void
}) {
  const [hovered, setHovered] = useState(false)
  const meshRef = useRef<THREE.Mesh>(null)
  
  const position: [number, number, number] = [
    (x - GRID_SIZE / 2) * CELL_SIZE + CELL_SIZE / 2,
    0,
    (z - GRID_SIZE / 2) * CELL_SIZE + CELL_SIZE / 2
  ]
  
  const floorCount = cell.floorCount || 1
  
  // Determine cell color
  let cellColor = '#e5e7eb' // Default gray
  if (cell.isRoad) {
    cellColor = '#6b7280' // Dark gray for roads
  } else if (cell.isPathway) {
    cellColor = '#d1d5db' // Lighter gray for pathways
  } else if (cell.isPark) {
    cellColor = '#22c55e' // Green for parks
  } else if (cell.hasHouse) {
    cellColor = '#78716c' // Brown for built lots
  } else if (hovered) {
    cellColor = '#4ade80' // Green on hover
  } else if (cell.isApartmentZone) {
    cellColor = '#dbeafe' // Light blue for apartment zones
  }
  
  return (
    <group position={position}>
      {/* Grid cell base */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation()
          onCellClick(x, z)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setHovered(false)
        }}
      >
        <boxGeometry args={[CELL_SIZE * 0.95, 0.05, CELL_SIZE * 0.95]} />
        <meshStandardMaterial
          color={cellColor}
          emissive={hovered && !cell.isRoad && !cell.isPathway && !cell.isPark && !cell.hasHouse ? '#4ade80' : undefined}
          emissiveIntensity={hovered && !cell.isRoad && !cell.isPathway && !cell.isPark && !cell.hasHouse ? 0.3 : 0}
          metalness={0.2}
          roughness={0.8}
        />
      </mesh>
      
      {/* House if built - stack for apartment zones */}
      {cell.hasHouse && (
        <>
          {Array.from({ length: floorCount }).map((_, floor) => (
            <mesh key={floor} position={[0, 0.15 + floor * 0.3, 0]}>
              <boxGeometry args={[CELL_SIZE * 0.7, 0.3, CELL_SIZE * 0.7]} />
              <meshStandardMaterial
                color={
                  cell.houseType === 'mansion' ? '#fbbf24' : 
                  cell.houseType === 'business' ? '#10b981' : 
                  '#8b5cf6'
                }
                metalness={0.3}
                roughness={0.7}
              />
            </mesh>
          ))}
        </>
      )}
      
      {/* Grid outline */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(CELL_SIZE * 0.95, 0.05, CELL_SIZE * 0.95)]} />
        <lineBasicMaterial color="#9ca3af" opacity={0.5} transparent />
      </lineSegments>
    </group>
  )
}

// Grass/landscape around grid
function Landscape() {
  const landscapeSize = GRID_SIZE * CELL_SIZE + PADDING * 2
  
  return (
    <>
      {/* Grass ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[landscapeSize, landscapeSize]} />
        <meshStandardMaterial color="#86efac" roughness={0.8} />
      </mesh>
      
      {/* Some decorative elements around the edges */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2
        const radius = GRID_SIZE * CELL_SIZE / 2 + PADDING * 0.7
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        
        return (
          <mesh key={i} position={[x, 0.1, z]}>
            <coneGeometry args={[0.2, 0.5, 8]} />
            <meshStandardMaterial color="#22c55e" />
          </mesh>
        )
      })}
    </>
  )
}

// Grid component
function Grid({ 
  grid, 
  onCellClick 
}: { 
  grid: Map<string, GridCell>
  onCellClick: (x: number, z: number) => void
}) {
  return (
    <>
      <Landscape />
      {Array.from(grid.entries()).map(([key, cell]) => {
        const [x, z] = key.split(',').map(Number)
        return (
          <GridCellComponent
            key={key}
            cell={cell}
            x={x}
            z={z}
            onCellClick={onCellClick}
          />
        )
      })}
    </>
  )
}

// Main village builder component
function VillageBuilderScene({ 
  villageId, 
  grid, 
  onCellClick 
}: { 
  villageId: string
  grid: Map<string, GridCell>
  onCellClick: (x: number, z: number) => void
}) {
  return (
    <Canvas camera={{ position: [8, 8, 8], fov: 50 }} gl={{ antialias: true }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <directionalLight position={[-10, 10, -5]} intensity={0.5} />
      
      <Grid grid={grid} onCellClick={onCellClick} />
      
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={20}
        target={[0, 0, 0]}
      />
    </Canvas>
  )
}

export function VillageBuilder({ villageId, villageName, userVerified }: VillageBuilderProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [selectedCell, setSelectedCell] = useState<{ x: number; z: number } | null>(null)
  const [userOwnedLots, setUserOwnedLots] = useState(0)
  const [hasAnyHomes, setHasAnyHomes] = useState(false)
  const [isNeighborNotesOpen, setIsNeighborNotesOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const maxLots = userVerified ? 3 : 1
  
  // Initialize and fetch lots data
  useEffect(() => {
    const initializeAndFetchLots = async () => {
      setIsLoading(true)
      try {
        // First, initialize lots if needed
        await fetch('/api/lots/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ villageId, villageName })
        })
        
        // Then fetch all lots
        const res = await fetch(`/api/lots/${villageId}`)
        if (res.ok) {
          const data = await res.json()
          setUserOwnedLots(data.userOwnedLots || 0)
          
          // Check if village has any homes (any lots with ownerId)
          if (data.lots && Array.isArray(data.lots)) {
            const hasHomes = data.lots.some((lot: any) => !!lot.ownerId)
            setHasAnyHomes(hasHomes)
          }
          
          // Update grid with existing lots from database
          if (data.lots && Array.isArray(data.lots)) {
            setCurrentGrid(prev => {
              const newGrid = new Map(prev)
              data.lots.forEach((lot: any) => {
                const key = `${lot.gridX},${lot.gridZ}`
                const existingCell = newGrid.get(key)
                if (existingCell) {
                  newGrid.set(key, {
                    ...existingCell,
                    hasHouse: !!lot.ownerId,
                    houseType: lot.houseType || 'basic',
                    floorCount: lot.floorCount || 1,
                    ownerId: lot.ownerId || undefined,
                    ownerName: lot.owner?.name || undefined,
                    address: lot.address || existingCell.address,
                    cost: lot.cost || existingCell.cost,
                    isRoad: lot.isRoad || false,
                    isPathway: lot.isPathway || false,
                    isApartmentZone: lot.isApartmentZone || false
                  })
                } else {
                  // Create cell from database lot
                  newGrid.set(key, {
                    x: lot.gridX,
                    z: lot.gridZ,
                    hasHouse: !!lot.ownerId,
                    houseType: lot.houseType || 'basic',
                    floorCount: lot.floorCount || 1,
                    ownerId: lot.ownerId || undefined,
                    ownerName: lot.owner?.name || undefined,
                    address: lot.address || generateAddress(lot.gridX, lot.gridZ, villageName),
                    cost: lot.cost || 100,
                    isRoad: lot.isRoad || false,
                    isPathway: lot.isPathway || false,
                    isPark: lot.isPark || false,
                    isApartmentZone: lot.isApartmentZone || false
                  })
                }
              })
              return newGrid
            })
          }
          
          // Data loaded successfully, hide loading message
          setIsLoading(false)
        } else {
          // Request failed, hide loading message
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Failed to fetch lots:', error)
      } finally {
        setIsLoading(false)
      }
    }
    initializeAndFetchLots()
  }, [villageId, villageName])
  
  // Initialize grid with roads, pathways, parks, and apartment zones
  const { grid, roads, pathways, parks, apartmentZones } = useMemo(() => {
    const initialGrid = new Map<string, GridCell>()
    const roads = generateRoads(villageId)
    const pathways = generatePathways(villageId, roads)
    const parks = generateParks(villageId, roads, pathways)
    const rng = new SeededRandom(villageIdToSeed(villageId) + 54321) // Unique seed for apartment zones
    const apartmentZones = new Set<string>()
    
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
    
    // Select some clusters (about 5-8 clusters for variety)
    const numClusters = Math.min(Math.floor(clusterPositions.length * 0.1), 8)
    const selectedClusters: Array<{x: number, z: number}> = []
    
    // Shuffle and select
    for (let i = clusterPositions.length - 1; i > 0 && selectedClusters.length < numClusters; i--) {
      const j = Math.floor(rng.next() * (i + 1))
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
    
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        const key = `${x},${z}`
        const isRoad = roads.has(key)
        const isPathway = pathways.has(key)
        const isPark = parks.has(key)
        const isApartmentZone = apartmentZones.has(key)
        
        initialGrid.set(key, {
          x,
          z,
          hasHouse: false,
          address: generateAddress(x, z, villageName),
          cost: generateLotCost(x, z, isApartmentZone),
          isRoad,
          isPathway,
          isPark,
          isApartmentZone
        })
      }
    }
    return { grid: initialGrid, roads, pathways, parks, apartmentZones }
  }, [villageId, villageName])
  
  const [currentGrid, setCurrentGrid] = useState(grid)
  
  // Update owned lots count
  useEffect(() => {
    const owned = Array.from(currentGrid.values()).filter(
      c => c.hasHouse && c.ownerId === session?.user?.id
    ).length
    setUserOwnedLots(owned)
  }, [currentGrid, session])
  
  const handleCellClick = (x: number, z: number) => {
    setSelectedCell({ x, z })
  }
  
  const handlePurchase = async (x: number, z: number) => {
    const key = `${x},${z}`
    const cell = currentGrid.get(key)
    
    if (!cell || cell.isRoad || cell.isPathway || cell.isPark || cell.hasHouse || userOwnedLots >= maxLots) {
      return
    }
    
    try {
      const res = await fetch('/api/lots/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          villageId,
          gridX: x,
          gridZ: z
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        // Update local state
        setCurrentGrid(prev => {
          const newGrid = new Map(prev)
          const updatedCell = {
            ...cell,
            hasHouse: true,
            houseType: 'basic',
            floorCount: cell.isApartmentZone ? 1 : 1,
            ownerId: session?.user?.id,
            ownerName: session?.user?.name || undefined
          }
          newGrid.set(key, updatedCell)
          return newGrid
        })
        setUserOwnedLots(prev => prev + 1)
        // Update hasAnyHomes after purchase
        setHasAnyHomes(true)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to purchase lot')
      }
    } catch (error) {
      console.error('Error purchasing lot:', error)
      alert('Failed to purchase lot')
    }
  }
  
  const selectedCellData = selectedCell ? currentGrid.get(`${selectedCell.x},${selectedCell.z}`) : null
  
  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-green-50 to-blue-50 dark:from-zinc-900 dark:to-zinc-800">
      {/* Top Right Controls - Dark Mode Toggle and Sign Out */}
      <TopRightControls />
      
      <Suspense fallback={
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-zinc-900 dark:text-zinc-100 text-xl">Loading 3D scene...</div>
        </div>
      }>
        <VillageBuilderScene 
          villageId={villageId} 
          grid={currentGrid} 
          onCellClick={handleCellClick}
        />
      </Suspense>
      
      {/* Loading State */}
      {isLoading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 text-white rounded-lg px-6 py-4 shadow-xl border-2 border-white/20 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="animate-spin text-2xl">⏳</div>
              <div>
                <p className="font-bold text-lg">Loading {villageName}...</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Empty Village Modal */}
      {!isLoading && !hasAnyHomes && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 text-white rounded-lg px-6 py-4 shadow-xl border-2 border-white/20 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🏠</div>
              <div>
                <p className="font-bold text-lg">No one's here yet!</p>
                <p className="text-sm opacity-90">Build the first home!</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Lot Details Modal */}
      <LotDetailsModal
        cell={selectedCellData || null}
        x={selectedCell?.x || 0}
        z={selectedCell?.z || 0}
        isOpen={!!selectedCell}
        onClose={() => setSelectedCell(null)}
        onPurchase={handlePurchase}
        canPurchase={!!session?.user?.id}
        userOwnedLots={userOwnedLots}
        maxLots={maxLots}
        currentUserId={session?.user?.id}
      />
      
      {/* UI Overlay */}
      <div className="absolute top-4 left-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
        <div className="flex items-center gap-4 mb-2">
          <Link 
            href="/planet"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to Planet
          </Link>
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Village Builder
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
          Click on grid cells to view lot details
        </p>
        <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-200 rounded"></div>
            <span>Empty lot</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-200 rounded"></div>
            <span>Apartment zone</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-600 rounded"></div>
            <span>Road</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span>House built</span>
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="absolute top-4 right-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Your Properties
        </h3>
        <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
          <p>Owned: {userOwnedLots} / {maxLots}</p>
          <p className="text-xs">
            {userVerified ? '✓ Verified - Up to 3 houses' : 'Unverified - 1 house limit'}
          </p>
        </div>
      </div>

      {/* Neighbor Notes Button */}
      {userOwnedLots > 0 && (
        <div className="absolute bottom-4 right-4">
          <button
            onClick={() => setIsNeighborNotesOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg shadow-lg font-medium transition-all transform hover:scale-105"
          >
            💌 Neighbor Notes
          </button>
        </div>
      )}

      {/* Neighbor Notes Modal */}
      <NeighborNotes
        villageId={villageId}
        villageName={villageName}
        isOpen={isNeighborNotesOpen}
        onClose={() => setIsNeighborNotesOpen(false)}
      />
    </div>
  )
}
