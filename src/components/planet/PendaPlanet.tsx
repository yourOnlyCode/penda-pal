'use client'

import { useRef, useState, useEffect, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import { useRouter } from 'next/navigation'
import { TopRightControls } from '@/components/dashboard/TopRightControls'
import * as THREE from 'three'

// Ensure Three.js is only imported client-side
if (typeof window === 'undefined') {
  // @ts-ignore
  global.THREE = {}
}

// Terrain types
export type TerrainType = 'land' | 'water' | 'ice' | 'mountain'

// Village data structure
export interface Village {
  id: string
  name: string
  position: THREE.Vector3
  terrain: TerrainType
}

// Scavenge spot data structure
export interface ScavengeSpot {
  id: string
  position: { x: number; y: number; z: number }
  emoji: string
  hasAttempted: boolean
}

interface PendaPlanetProps {
  onVillageClick?: (village: Village) => void
  userId?: string
}

// Simple seeded random number generator for deterministic results
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

// Get terrain color
function getTerrainColor(terrain: TerrainType): THREE.Color {
  switch (terrain) {
    case 'land':
      return new THREE.Color(0x4ade80) // Green
    case 'water':
      return new THREE.Color(0x3b82f6) // Blue
    case 'ice':
      return new THREE.Color(0xe0e7ff) // Light blue/white
    case 'mountain':
      return new THREE.Color(0x78716c) // Gray/brown
    default:
      return new THREE.Color(0x6b7280) // Gray
  }
}

// Assign terrain to vertices on the sphere
function assignTerrainToVertices(geometry: THREE.BufferGeometry, planetRadius: number): Float32Array {
  const positions = geometry.attributes.position
  const colors: number[] = []
  
  const rng = new SeededRandom(12345)
  const totalVertices = positions.count
  
  // Calculate terrain counts
  // Reduced land percentage for bigger oceans (25% instead of 30%)
  const landCount = Math.floor(totalVertices * 0.25) // 25% land (was 30%)
  const mountainCount = Math.floor(totalVertices * 0.05) // 5% mountains
  const iceCount = Math.floor(totalVertices * 0.05) // 5% ice
  const waterCount = totalVertices - landCount - mountainCount - iceCount // ~65% water (was 60%)
  
  // Create terrain array for each vertex
  const terrainArray: TerrainType[] = new Array(totalVertices).fill('water')
  
  // Assign land with strong clustering - create continent seeds
  let assigned = 0
  const landSeeds: number[] = []
  
  // Create fewer, larger land clusters (continents)
  const numContinents = Math.floor(landCount / 15) // ~15 vertices per continent seed
  for (let i = 0; i < numContinents && assigned < landCount; i++) {
    const index = Math.floor(rng.next() * totalVertices)
    const vertex = new THREE.Vector3()
    vertex.fromBufferAttribute(positions, index)
    const absY = Math.abs(vertex.y)
    // Avoid poles for continent seeds
    if (terrainArray[index] === 'water' && absY < planetRadius * 0.8) {
      terrainArray[index] = 'land'
      landSeeds.push(index)
      assigned++
    }
  }
  
  // Grow continents from seeds with strong clustering
  while (assigned < landCount && landSeeds.length > 0) {
    const seedIndex = landSeeds.shift()!
    const seedVertex = new THREE.Vector3()
    seedVertex.fromBufferAttribute(positions, seedIndex)
    
    // Find nearby vertices to grow the continent
    for (let j = 0; j < totalVertices && assigned < landCount; j++) {
      if (j === seedIndex) continue
      const otherVertex = new THREE.Vector3()
      otherVertex.fromBufferAttribute(positions, j)
      const distance = seedVertex.distanceTo(otherVertex)
      const absY = Math.abs(otherVertex.y)
      
      // Grow within a close radius, avoid poles
      if (distance < planetRadius * 0.25 && absY < planetRadius * 0.85 && terrainArray[j] === 'water') {
        // Higher probability of growing for closer vertices
        const growChance = 0.6 * (1 - distance / (planetRadius * 0.25))
        if (rng.next() < growChance) {
          terrainArray[j] = 'land'
          landSeeds.push(j) // Add as new seed to continue growing
          assigned++
        }
      }
    }
  }
  
  // Assign mountains (5%) - prefer areas with higher elevation (Y coordinate)
  const sortedByY: number[] = []
  for (let i = 0; i < totalVertices; i++) {
    const vertex = new THREE.Vector3()
    vertex.fromBufferAttribute(positions, i)
    sortedByY.push(i)
  }
  sortedByY.sort((a, b) => {
    const va = new THREE.Vector3()
    const vb = new THREE.Vector3()
    va.fromBufferAttribute(positions, a)
    vb.fromBufferAttribute(positions, b)
    return Math.abs(vb.y) - Math.abs(va.y) // Sort by absolute Y (elevation)
  })
  
  assigned = 0
  let mountainAssigned = 0
  while (mountainAssigned < mountainCount && assigned < sortedByY.length) {
    const candidateIndex = Math.floor(rng.next() * Math.min(200, sortedByY.length))
    const index = sortedByY[candidateIndex]
    if (terrainArray[index] === 'land') {
      terrainArray[index] = 'mountain'
      mountainAssigned++
    }
    assigned++
  }
  
  // Assign ice (5%) - prefer areas near poles but not at exact poles to avoid swirling
  assigned = 0
  let iceAssigned = 0
  while (iceAssigned < iceCount && assigned < sortedByY.length) {
    const candidateIndex = Math.floor(rng.next() * Math.min(100, sortedByY.length))
    const index = sortedByY[candidateIndex]
    
    // Check if this vertex is near pole but not too close (avoid exact poles)
    const vertex = new THREE.Vector3()
    vertex.fromBufferAttribute(positions, index)
    const absY = Math.abs(vertex.y)
    const isNearPole = absY > planetRadius * 0.6 && absY < planetRadius * 0.9 // Avoid exact poles
    
    if (terrainArray[index] === 'water' && isNearPole) {
      terrainArray[index] = 'ice'
      iceAssigned++
    }
    assigned++
  }
  
  // Apply clustering to make terrain more realistic
  // Smooth out terrain by checking neighbors, but avoid poles to prevent swirling
  // More iterations for better land clustering
  for (let iteration = 0; iteration < 3; iteration++) {
    const newTerrain = [...terrainArray]
    for (let i = 0; i < totalVertices; i++) {
      const vertex = new THREE.Vector3()
      vertex.fromBufferAttribute(positions, i)
      
      // Skip clustering near exact poles to prevent swirling
      const absY = Math.abs(vertex.y)
      if (absY > planetRadius * 0.95) {
        continue // Don't modify terrain at exact poles
      }
      
      // Find nearby vertices (within a threshold)
      let landNeighbors = 0
      let waterNeighbors = 0
      let iceNeighbors = 0
      let mountainNeighbors = 0
      
      for (let j = 0; j < totalVertices; j++) {
        if (i === j) continue
        const otherVertex = new THREE.Vector3()
        otherVertex.fromBufferAttribute(positions, j)
        const distance = vertex.distanceTo(otherVertex)
        
        if (distance < planetRadius * 0.3) { // Neighbor threshold
          const neighborTerrain = terrainArray[j]
          if (neighborTerrain === 'land') landNeighbors++
          else if (neighborTerrain === 'water') waterNeighbors++
          else if (neighborTerrain === 'ice') iceNeighbors++
          else if (neighborTerrain === 'mountain') mountainNeighbors++
        }
      }
      
      // If surrounded by same terrain, keep it; otherwise, might change
      // But make it harder to break up land clusters for bigger oceans
      const currentTerrain = terrainArray[i]
      if (currentTerrain === 'land' && landNeighbors < 3 && waterNeighbors > 4) {
        // Lower chance to break up land clusters
        if (rng.next() < 0.15) newTerrain[i] = 'water' // Reduced from 0.3
      } else if (currentTerrain === 'water' && waterNeighbors < 2 && landNeighbors > 4) {
        // Higher chance to expand land into water (but this is less likely now with fewer land seeds)
        if (rng.next() < 0.4) newTerrain[i] = 'land' // Increased from 0.3
      }
    }
    terrainArray.splice(0, terrainArray.length, ...newTerrain)
  }
  
  // Convert terrain to colors
  for (let i = 0; i < totalVertices; i++) {
    const color = getTerrainColor(terrainArray[i])
    colors.push(color.r, color.g, color.b)
  }
  
  return new Float32Array(colors)
}

// Create planet mesh with terrain colors and bumps
function createPlanetMesh(planetRadius: number): THREE.Mesh {
  // Create a smooth sphere without visible triangles
  const geometry = new THREE.SphereGeometry(planetRadius, 64, 32) // High resolution for smooth sphere
  
  // Add terrain-based height variation (bumps)
  const positions = geometry.attributes.position
  const rng = new SeededRandom(12345)
  
  // First assign terrain to get terrain information
  const colors = assignTerrainToVertices(geometry, planetRadius)
  
  // Create a map of terrain types for each vertex
  const terrainMap = new Map<number, TerrainType>()
  const rng2 = new SeededRandom(12345)
  const totalVertices = positions.count
  
  // Re-assign terrain to build terrain map (simplified version)
  // Reduced land for bigger oceans (25% instead of 30%)
  const landCount = Math.floor(totalVertices * 0.25)
  const mountainCount = Math.floor(totalVertices * 0.05)
  const iceCount = Math.floor(totalVertices * 0.05)
  
  // Initialize all as water
  for (let i = 0; i < totalVertices; i++) {
    terrainMap.set(i, 'water')
  }
  
  // Assign land with continent clustering
  let assigned = 0
  const landSeeds: number[] = []
  
  // Create fewer, larger land clusters (continents)
  const numContinents = Math.floor(landCount / 15) // ~15 vertices per continent seed
  for (let i = 0; i < numContinents && assigned < landCount; i++) {
    const index = Math.floor(rng2.next() * totalVertices)
    const vertex = new THREE.Vector3()
    vertex.fromBufferAttribute(positions, index)
    const absY = Math.abs(vertex.y)
    // Avoid poles for continent seeds
    if (terrainMap.get(index) === 'water' && absY < planetRadius * 0.8) {
      terrainMap.set(index, 'land')
      landSeeds.push(index)
      assigned++
    }
  }
  
  // Grow continents from seeds with strong clustering
  while (assigned < landCount && landSeeds.length > 0) {
    const seedIndex = landSeeds.shift()!
    const seedVertex = new THREE.Vector3()
    seedVertex.fromBufferAttribute(positions, seedIndex)
    
    // Find nearby vertices to grow the continent
    for (let j = 0; j < totalVertices && assigned < landCount; j++) {
      if (j === seedIndex) continue
      const otherVertex = new THREE.Vector3()
      otherVertex.fromBufferAttribute(positions, j)
      const distance = seedVertex.distanceTo(otherVertex)
      const absY = Math.abs(otherVertex.y)
      
      // Grow within a close radius, avoid poles
      if (distance < planetRadius * 0.25 && absY < planetRadius * 0.85 && terrainMap.get(j) === 'water') {
        // Higher probability of growing for closer vertices
        const growChance = 0.6 * (1 - distance / (planetRadius * 0.25))
        if (rng2.next() < growChance) {
          terrainMap.set(j, 'land')
          landSeeds.push(j) // Add as new seed to continue growing
          assigned++
        }
      }
    }
  }
  
  // Assign mountains on land, avoid poles
  assigned = 0
  let mountainAssigned = 0
  while (mountainAssigned < mountainCount && assigned < totalVertices * 10) {
    const index = Math.floor(rng2.next() * totalVertices)
    const vertex = new THREE.Vector3()
    vertex.fromBufferAttribute(positions, index)
    const absY = Math.abs(vertex.y)
    // Avoid poles for mountains
    if (terrainMap.get(index) === 'land' && absY < planetRadius * 0.85) {
      terrainMap.set(index, 'mountain')
      mountainAssigned++
    }
    assigned++
  }
  
  // Assign ice near poles
  assigned = 0
  let iceAssigned = 0
  while (iceAssigned < iceCount && assigned < totalVertices * 10) {
    const index = Math.floor(rng2.next() * totalVertices)
    const vertex = new THREE.Vector3()
    vertex.fromBufferAttribute(positions, index)
    const absY = Math.abs(vertex.y)
    if (terrainMap.get(index) === 'water' && absY > planetRadius * 0.6 && absY < planetRadius * 0.9) {
      terrainMap.set(index, 'ice')
      iceAssigned++
    }
    assigned++
  }
  
  // Modify vertex positions based on terrain to create smooth, rounded bumps
  for (let i = 0; i < positions.count; i++) {
    const vertex = new THREE.Vector3()
    vertex.fromBufferAttribute(positions, i)
    const normal = vertex.clone().normalize()
    
    const terrain = terrainMap.get(i) || 'water'
    const absY = Math.abs(vertex.y)
    const isNearPole = absY > planetRadius * 0.9
    
    let heightMultiplier = 1.0
    
    // Skip height variation at exact poles to prevent swirling
    if (!isNearPole) {
      if (terrain === 'mountain') {
        // More rounded, gentler mountains
        heightMultiplier = 1.04 // Reduced from 1.08 for rounder appearance
      } else if (terrain === 'land') {
        // Very slight elevation for land
        heightMultiplier = 1.01 // Reduced from 1.03
      } else if (terrain === 'ice') {
        // Slight depression for ice
        heightMultiplier = 0.99
      }
    }
    
    // Apply height variation
    const newPosition = normal.multiplyScalar(planetRadius * heightMultiplier)
    positions.setXYZ(i, newPosition.x, newPosition.y, newPosition.z)
  }
  
  // Recalculate normals for smooth lighting
  geometry.computeVertexNormals()
  
  // Convert terrain map to colors
  const finalColors: number[] = []
  for (let i = 0; i < positions.count; i++) {
    const terrain = terrainMap.get(i) || 'water'
    const color = getTerrainColor(terrain)
    finalColors.push(color.r, color.g, color.b)
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(finalColors, 3))
  
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.7,
    metalness: 0.3,
    flatShading: false // Smooth shading
  })
  
  return new THREE.Mesh(geometry, material)
}

// Generate villages on land terrain
function generateVillages(geometry: THREE.BufferGeometry, terrainMap: Map<number, TerrainType>, planetRadius: number): Village[] {
  const positions = geometry.attributes.position
  const villages: Village[] = []
  const rng = new SeededRandom(54321) // Different seed for villages
  const totalVertices = positions.count
  
  // Find all land vertices
  const landVertices: number[] = []
  for (let i = 0; i < totalVertices; i++) {
    const terrain = terrainMap.get(i)
    if (terrain === 'land' || terrain === 'mountain') {
      landVertices.push(i)
    }
  }
  
  // Generate villages (about 1 village per 50 land vertices, but max 20 villages)
  const numVillages = Math.min(Math.floor(landVertices.length / 50), 20)
  const villageNames = [
    'Panda Village', 'Bamboo Grove', 'Misty Haven', 'Zen Settlement',
    'Sunset Shores', 'Coral Cove', 'Cloud Peak', 'Mystic Valley',
    'Frozen Outpost', 'Green Meadow', 'River Bend', 'Forest Edge',
    'Mountain View', 'Peaceful Plains', 'Golden Fields', 'Silver Lake',
    'Crystal Springs', 'Emerald Hills', 'Diamond Point', 'Ruby Ridge'
  ]
  
  const usedIndices = new Set<number>()
  
  for (let i = 0; i < numVillages && i < villageNames.length; i++) {
    let attempts = 0
    let villageIndex: number | null = null
    
    // Try to find a land vertex that's not too close to other villages
    while (attempts < 100 && villageIndex === null) {
      const candidateIndex = Math.floor(rng.next() * landVertices.length)
      const vertexIndex = landVertices[candidateIndex]
      
      // Check distance from other villages
      let tooClose = false
      const candidatePos = new THREE.Vector3()
      candidatePos.fromBufferAttribute(positions, vertexIndex)
      
      for (const existingVillage of villages) {
        const distance = candidatePos.distanceTo(existingVillage.position)
        if (distance < planetRadius * 0.4) {
          tooClose = true
          break
        }
      }
      
      if (!tooClose && !usedIndices.has(vertexIndex)) {
        villageIndex = vertexIndex
        usedIndices.add(vertexIndex)
      }
      
      attempts++
    }
    
    if (villageIndex !== null) {
      const position = new THREE.Vector3()
      position.fromBufferAttribute(positions, villageIndex)
      position.normalize().multiplyScalar(planetRadius + 0.05) // Slightly above surface
      
      const terrain = terrainMap.get(villageIndex) || 'land'
      
      villages.push({
        id: `village-${i}`,
        name: villageNames[i] || `Village ${i + 1}`,
        position,
        terrain
      })
    }
  }
  
  return villages
}

// Village marker component
function VillageMarker({ 
  village, 
  onClick,
  isUserHome
}: { 
  village: Village
  onClick: () => void
  isUserHome?: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  
  // Load texture
  useEffect(() => {
    const loader = new THREE.TextureLoader()
    loader.load('/panda-icon.png', (loadedTexture) => {
      loadedTexture.flipY = true // Flip to correct orientation
      setTexture(loadedTexture)
    })
  }, [])
  
  const { camera } = useThree()
  
  // Make plane always face camera (billboard effect)
  useFrame(() => {
    if (meshRef.current && camera) {
      meshRef.current.lookAt(camera.position)
    }
  })
  
  // Calculate position higher above the surface (planet radius is 2, so 2.2 is higher)
  const offsetPosition = village.position.clone().normalize().multiplyScalar(2.2)
  
  return (
    <group position={offsetPosition}>
      {/* Panda icon as a billboard plane (always faces camera) */}
      <mesh
        ref={meshRef}
        onClick={(e: any) => {
          e.stopPropagation()
          onClick()
        }}
        onPointerOver={(e: any) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={(e: any) => {
          e.stopPropagation()
          setHovered(false)
        }}
        scale={hovered ? 0.25 : 0.2}
        rotation={[Math.PI, 0, 0]} // Rotate 180 degrees to fix upside-down
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={texture}
          transparent={true}
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Star above panda icon for user's home */}
      {isUserHome && (
        <group position={[0, 0.4, 0]}>
          {/* Center of star */}
          <mesh>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshBasicMaterial color="#FFD700" />
          </mesh>
          {/* Star points */}
          {[0, 1, 2, 3, 4].map((i) => {
            const angle = (i * Math.PI * 2) / 5 - Math.PI / 2
            return (
              <mesh
                key={i}
                position={[Math.cos(angle) * 0.1, Math.sin(angle) * 0.1, 0]}
                rotation={[0, 0, angle]}
              >
                <coneGeometry args={[0.04, 0.12, 3]} />
                <meshBasicMaterial color="#FFD700" />
              </mesh>
            )
          })}
        </group>
      )}
      
      {/* Village name tooltip */}
      {hovered && (
        <Html
          position={[0, 0.15, 0]}
          center
          distanceFactor={10}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div className="bg-black/80 text-white px-2 py-1 rounded text-sm font-bold whitespace-nowrap">
            {village.name}
          </div>
        </Html>
      )}
    </group>
  )
}


// Scavenge marker component
function ScavengeMarker({ 
  spot, 
  onClick 
}: { 
  spot: ScavengeSpot
  onClick: () => void 
}) {
  const [hovered, setHovered] = useState(false)
  
  // Calculate position
  const position = new THREE.Vector3(spot.position.x, spot.position.y, spot.position.z)
  
  return (
    <group position={position}>
      {/* Invisible sphere for click detection */}
      <mesh
        onClick={(e: any) => {
          e.stopPropagation()
          onClick()
        }}
        onPointerOver={(e: any) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={(e: any) => {
          e.stopPropagation()
          setHovered(false)
        }}
      >
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial
          transparent={true}
          opacity={0}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Emoji text */}
      <Html
        position={[0, 0, 0]}
        center
        distanceFactor={10}
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
          opacity: spot.hasAttempted ? 0.5 : 1,
        }}
      >
        <div className={`text-4xl transition-transform ${hovered ? 'scale-125' : ''}`}>
          {spot.emoji}
        </div>
      </Html>
    </group>
  )
}

// Cloud component - floating transparent clouds that circle the planet
function Cloud({ 
  initialPosition, 
  rotationSpeed 
}: { 
  initialPosition: THREE.Vector3
  rotationSpeed: number
}) {
  const cloudRef = useRef<THREE.Group>(null)
  const angleRef = useRef(0)
  
  useFrame((state, delta) => {
    if (cloudRef.current) {
      // Orbit around the planet's Y axis
      angleRef.current += rotationSpeed * delta
      
      // Calculate new position orbiting around Y axis
      const radius = initialPosition.length()
      const currentAngle = Math.atan2(initialPosition.z, initialPosition.x) + angleRef.current
      
      cloudRef.current.position.x = radius * Math.cos(currentAngle)
      cloudRef.current.position.z = radius * Math.sin(currentAngle)
      cloudRef.current.position.y = initialPosition.y // Keep same height
    }
  })
  
  // Create a fluffy cloud shape using multiple spheres
  return (
    <group 
      ref={cloudRef}
      position={initialPosition}
    >
      {/* Main cloud body - multiple overlapping spheres for fluffy effect */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.3}
          roughness={0.8}
        />
      </mesh>
      <mesh position={[0.1, 0.05, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.3}
          roughness={0.8}
        />
      </mesh>
      <mesh position={[-0.1, 0.05, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.3}
          roughness={0.8}
        />
      </mesh>
      <mesh position={[0, 0.1, 0.05]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.3}
          roughness={0.8}
        />
      </mesh>
      <mesh position={[0, -0.05, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.3}
          roughness={0.8}
        />
      </mesh>
    </group>
  )
}

// Planet component
function Planet({ 
  villages, 
  scavengeSpots,
  onVillageClick,
  onScavengeClick,
  userHomeVillageId
}: { 
  villages: Village[]
  scavengeSpots: ScavengeSpot[]
  onVillageClick: (village: Village) => void
  onScavengeClick: (spot: ScavengeSpot) => void
  userHomeVillageId?: string | null
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const planetRadius = 2
  
  // Generate cloud positions around the planet
  const clouds = useMemo(() => {
    const cloudCount = 8 // Number of clouds
    const cloudPositions: Array<{ position: THREE.Vector3, speed: number }> = []
    const rng = new SeededRandom(54321) // Deterministic cloud positions
    
    for (let i = 0; i < cloudCount; i++) {
      // Random position on sphere surface
      const theta = rng.next() * Math.PI * 2 // Azimuth
      const phi = Math.acos(2 * rng.next() - 1) // Elevation
      const radius = planetRadius * 1.15 // Slightly above planet
      
      const position = new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      )
      
      // Random rotation speed (slow, different for each cloud)
      const speed = 0.1 + rng.next() * 0.2 // Between 0.1 and 0.3
      
      cloudPositions.push({ position, speed })
    }
    
    return cloudPositions
  }, [planetRadius])
  
  // Create planet mesh
  const planetMesh = useMemo(() => {
    return createPlanetMesh(planetRadius)
  }, [planetRadius])
  
  return (
    <>
      <primitive
        ref={meshRef}
        object={planetMesh}
      />
      
      {/* Render villages */}
      {villages.map((village) => (
        <VillageMarker
          key={village.id}
          village={village}
          onClick={() => onVillageClick(village)}
          isUserHome={village.id === userHomeVillageId}
        />
      ))}
      
      {/* Render scavenge spots */}
      {scavengeSpots.map((spot) => (
        <ScavengeMarker
          key={spot.id}
          spot={spot}
          onClick={() => onScavengeClick(spot)}
        />
      ))}
      
      {/* Render floating clouds */}
      {clouds.map((cloud, index) => (
        <Cloud
          key={index}
          initialPosition={cloud.position}
          rotationSpeed={cloud.speed}
        />
      ))}
    </>
  )
}

export function PendaPlanet({ onVillageClick, userId }: PendaPlanetProps) {
  const [isClient, setIsClient] = useState(false)
  const [scavengeSpots, setScavengeSpots] = useState<ScavengeSpot[]>([])
  const [userHomeVillageId, setUserHomeVillageId] = useState<string | null>(null)
  const planetRadius = 2
  const router = useRouter()
  
  // Generate villages based on terrain
  const { villages, terrainMap } = useMemo(() => {
    // Create a temporary geometry to get terrain map
    const tempGeometry = new THREE.SphereGeometry(planetRadius, 64, 32)
    const tempTerrainMap = new Map<number, TerrainType>()
    
    // Get terrain assignment
    const positions = tempGeometry.attributes.position
    const rng = new SeededRandom(12345)
    const totalVertices = positions.count
    
    const landCount = Math.floor(totalVertices * 0.25)
    const mountainCount = Math.floor(totalVertices * 0.05)
    const iceCount = Math.floor(totalVertices * 0.05)
    
    // Initialize all as water
    for (let i = 0; i < totalVertices; i++) {
      tempTerrainMap.set(i, 'water')
    }
    
    // Assign land with clustering (simplified version)
    let assigned = 0
    const landSeeds: number[] = []
    const numContinents = Math.floor(landCount / 15)
    
    for (let i = 0; i < numContinents && assigned < landCount; i++) {
      const index = Math.floor(rng.next() * totalVertices)
      const vertex = new THREE.Vector3()
      vertex.fromBufferAttribute(positions, index)
      const absY = Math.abs(vertex.y)
      if (tempTerrainMap.get(index) === 'water' && absY < planetRadius * 0.8) {
        tempTerrainMap.set(index, 'land')
        landSeeds.push(index)
        assigned++
      }
    }
    
    // Grow continents
    while (assigned < landCount && landSeeds.length > 0) {
      const seedIndex = landSeeds.shift()!
      const seedVertex = new THREE.Vector3()
      seedVertex.fromBufferAttribute(positions, seedIndex)
      
      for (let j = 0; j < totalVertices && assigned < landCount; j++) {
        if (j === seedIndex) continue
        const otherVertex = new THREE.Vector3()
        otherVertex.fromBufferAttribute(positions, j)
        const distance = seedVertex.distanceTo(otherVertex)
        const absY = Math.abs(otherVertex.y)
        
        if (distance < planetRadius * 0.25 && absY < planetRadius * 0.85 && tempTerrainMap.get(j) === 'water') {
          const growChance = 0.6 * (1 - distance / (planetRadius * 0.25))
          if (rng.next() < growChance) {
            tempTerrainMap.set(j, 'land')
            landSeeds.push(j)
            assigned++
          }
        }
      }
    }
    
    // Assign mountains
    assigned = 0
    let mountainAssigned = 0
    while (mountainAssigned < mountainCount && assigned < totalVertices * 10) {
      const index = Math.floor(rng.next() * totalVertices)
      const vertex = new THREE.Vector3()
      vertex.fromBufferAttribute(positions, index)
      const absY = Math.abs(vertex.y)
      if (tempTerrainMap.get(index) === 'land' && absY < planetRadius * 0.85) {
        tempTerrainMap.set(index, 'mountain')
        mountainAssigned++
      }
      assigned++
    }
    
    // Generate villages
    const generatedVillages = generateVillages(tempGeometry, tempTerrainMap, planetRadius)
    
    return { villages: generatedVillages, terrainMap: tempTerrainMap }
  }, [planetRadius])

  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Fetch scavenge spots
  useEffect(() => {
    if (isClient) {
      fetch('/api/scavenge/spots')
        .then(res => res.json())
        .then(data => {
          if (data.spots) {
            setScavengeSpots(data.spots)
          }
        })
        .catch(err => console.error('Error fetching scavenge spots:', err))
    }
  }, [isClient])
  
  // Fetch user's home village (village where they own a lot)
  useEffect(() => {
    if (isClient && userId) {
      fetch('/api/lots/user-homes')
        .then(res => res.json())
        .then(data => {
          if (data.villageId) {
            setUserHomeVillageId(data.villageId)
          }
        })
        .catch(err => console.error('Error fetching user home:', err))
    }
  }, [isClient, userId])
  
  const handleVillageClick = (village: Village) => {
    console.log('Clicked village:', village.name)
    // Navigate to village builder page
    router.push(`/planet/village/${village.id}`)
    if (onVillageClick) {
      onVillageClick(village)
    }
  }
  
  const handleScavengeClick = (spot: ScavengeSpot) => {
    // Scavenge spots are just visual markers for now
    // Puzzle functionality removed - keeping emojis for future use
    console.log('Scavenge spot clicked:', spot.emoji)
  }

  if (typeof window === 'undefined' || !isClient) {
    return (
      <div className="w-full h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading Penda Planet...</div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-black overflow-hidden">
      <Suspense fallback={
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-white text-xl">Loading 3D scene...</div>
        </div>
      }>
        <Canvas camera={{ position: [0, 0, 6.5], fov: 50 }} gl={{ antialias: true }}>
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3b82f6" />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          
          <Planet 
            villages={villages} 
            scavengeSpots={scavengeSpots}
            onVillageClick={handleVillageClick}
            onScavengeClick={handleScavengeClick}
            userHomeVillageId={userHomeVillageId}
          />
          
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            enableRotate={true}
            minDistance={4}
            maxDistance={12}
            autoRotate={false}
            rotateSpeed={0.5}
          />
        </Canvas>
      </Suspense>
      
      <div className="absolute top-4 left-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Penda Planet</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
          Click and drag to rotate
        </p>
        <div className="flex gap-4 text-xs text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span>Land</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span>Water</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-200"></div>
            <span>Ice</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gray-500"></div>
            <span>Mountain</span>
          </div>
        </div>
      </div>
    </div>
  )
}
