'use client'

import { useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'
import { Button } from '@/components/ui/button'
import { RotateCcw, Trophy, X, Triangle } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

interface PendaGameProps {
  onGameOver: (score: number) => void
  currentHighScore: number
  onExit?: () => void
}

// Game constants
const GAME_HEIGHT = 450
const WALL_THICKNESS = 40 // Thicker walls to prevent tunneling
const CIRCLE_SCALE = 0.75 // Slightly larger balls (increased from 0.6)
const MAX_CHARGE = 2.0 // Maximum charge time in seconds
const MAX_LAUNCH_VELOCITY = 15 // Maximum launch velocity

const ANIMAL_TYPES = [
  { radius: 20 * CIRCLE_SCALE, color: '#ffadad', score: 10, label: 'Tiny' },
  { radius: 35 * CIRCLE_SCALE, color: '#ffd6a5', score: 20, label: 'Small' },
  { radius: 50 * CIRCLE_SCALE, color: '#fdffb6', score: 40, label: 'Medium' },
  { radius: 70 * CIRCLE_SCALE, color: '#caffbf', score: 80, label: 'Large' },
  { radius: 90 * CIRCLE_SCALE, color: '#9bf6ff', score: 160, label: 'XL' },
  { radius: 120 * CIRCLE_SCALE, color: '#a0c4ff', score: 320, label: 'Panda' },
]

export function PendaGame({ onGameOver, currentHighScore, onExit }: PendaGameProps) {
  const sceneRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<Matter.Engine | null>(null)
  const renderRef = useRef<Matter.Render | null>(null)
  const [score, setScore] = useState(0)
  const [nextAnimalIndex, setNextAnimalIndex] = useState(0)
  const [isGameOver, setIsGameOver] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false) // Start with "Start" screen? No, auto start on flip
  const [debugMsg, setDebugMsg] = useState('')
  const [gameWidth, setGameWidth] = useState(320)
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false)
  const [leaderboard, setLeaderboard] = useState<Array<{ id: string; name: string | null; highScore: number; image: string | null }>>([])
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false)
  const [gameKey, setGameKey] = useState(0) // Key to force remount on restart
  const [charge, setCharge] = useState(0) // Charge level (0 to 1)
  const [isCharging, setIsCharging] = useState(false)
  const [chargeStartTime, setChargeStartTime] = useState(0)
  const [chargePosition, setChargePosition] = useState({ x: 0, y: 0 })
  const chargeIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [nextShapeType, setNextShapeType] = useState<'circle' | 'triangle'>('circle') // Next shape to drop
  const isChargingRef = useRef(false) // Ref to track charging state for event handlers
  const currentChargeRef = useRef(0) // Ref to track current charge value

  // Get container width on mount and resize
  useEffect(() => {
    if (!sceneRef.current) return

    const updateWidth = () => {
      if (sceneRef.current) {
        const width = sceneRef.current.offsetWidth
        setGameWidth(width)
      }
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  useEffect(() => {
    if (!sceneRef.current || gameWidth === 0) return

    // --- SETUP MATTER.JS ---
    const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Body = Matter.Body,
      Composite = Matter.Composite,
      Events = Matter.Events,
      Mouse = Matter.Mouse,
      MouseConstraint = Matter.MouseConstraint

    const engine = Engine.create()
    engineRef.current = engine

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: gameWidth,
        height: GAME_HEIGHT,
        wireframes: false,
        background: 'transparent',
      },
    })
    renderRef.current = render

    // --- BOUNDARIES ---
    const ground = Bodies.rectangle(gameWidth / 2, GAME_HEIGHT + WALL_THICKNESS / 2 - 10, gameWidth, WALL_THICKNESS, { 
      isStatic: true,
      restitution: 0.6, // Bouncy ground
      friction: 0.3, // Some friction on ground
      render: { fillStyle: '#ddd' }
    })
    const leftWall = Bodies.rectangle(0 - WALL_THICKNESS / 2, GAME_HEIGHT / 2, WALL_THICKNESS, GAME_HEIGHT * 2, { 
      isStatic: true,
      restitution: 0.7, // Bouncy walls
      friction: 0.1, // Low friction on walls
      render: { fillStyle: '#ddd' }
    })
    const rightWall = Bodies.rectangle(gameWidth + WALL_THICKNESS / 2, GAME_HEIGHT / 2, WALL_THICKNESS, GAME_HEIGHT * 2, { 
      isStatic: true,
      restitution: 0.7, // Bouncy walls
      friction: 0.1, // Low friction on walls
      render: { fillStyle: '#ddd' }
    })

    Composite.add(engine.world, [ground, leftWall, rightWall])

    // --- GAME LOGIC ---
    let currentNextIndex = Math.floor(Math.random() * 3) // Start with smaller ones
    setNextAnimalIndex(currentNextIndex)
    
    // Determine next shape type (5% chance for triangle)
    const getNextShapeType = (): 'circle' | 'triangle' => {
      return Math.random() < 0.05 ? 'triangle' : 'circle'
    }
    let currentNextShapeType = getNextShapeType()
    setNextShapeType(currentNextShapeType)
    
    let canDrop = true
    let currentCharge = 0
    let chargeStart = 0
    let chargeX = 0

    // Charge start handler
    const handleChargeStart = (e: MouseEvent | TouchEvent) => {
      e.preventDefault() // Prevent default behavior
      if (isGameOver || !canDrop || isChargingRef.current) return
      
      const rect = render.canvas.getBoundingClientRect()
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY
      
      chargeX = clientX - rect.left
      chargeStart = Date.now()
      currentCharge = 0
      currentChargeRef.current = 0
      
      isChargingRef.current = true
      setIsCharging(true)
      setChargePosition({ x: clientX, y: clientY })
      setCharge(0)
      
      // Update charge continuously
      const updateCharge = () => {
        if (!isChargingRef.current) return
        const elapsed = (Date.now() - chargeStart) / 1000
        currentCharge = Math.min(elapsed / MAX_CHARGE, 1)
        currentChargeRef.current = currentCharge
        setCharge(currentCharge)
        
        if (currentCharge < 1 && isChargingRef.current) {
          chargeIntervalRef.current = setTimeout(updateCharge, 16) // ~60fps
        }
      }
      updateCharge()
    }

    // Charge release handler
    const handleChargeRelease = (e?: MouseEvent | TouchEvent) => {
      if (e) e.preventDefault()
      if (!isChargingRef.current || isGameOver || !canDrop) return
      
      isChargingRef.current = false
      setIsCharging(false)
      if (chargeIntervalRef.current) {
        clearTimeout(chargeIntervalRef.current)
        chargeIntervalRef.current = null
      }

      // Get the current charge value from ref
      const finalCharge = currentChargeRef.current

      // Get x position relative to canvas
      const rect = render.canvas.getBoundingClientRect()
      let x = chargeX

      // Calculate curve based on click position relative to center
      const centerX = render.canvas.width / 2
      const offsetFromCenter = x - centerX
      const curveStrength = (offsetFromCenter / centerX) * 3 // Scale the curve effect (max 3 units of velocity)

      // Calculate launch velocity based on charge (minimum velocity even with no charge)
      const launchVelocity = Math.max(finalCharge * MAX_LAUNCH_VELOCITY, 2) // Minimum 2 units of velocity

      let body: Matter.Body

      if (currentNextShapeType === 'triangle') {
        // Create triangle
        const triangleSize = 50 * CIRCLE_SCALE
        const clampSize = triangleSize * 0.866 // Approximate radius for clamping
        const currentWidth = render.canvas.width
        x = Math.max(clampSize + 10, Math.min(x, currentWidth - clampSize - 10))

        body = Bodies.fromVertices(
          x, 50,
          [
            { x: 0, y: -triangleSize },
            { x: triangleSize * 0.866, y: triangleSize * 0.5 }, // cos(60) = 0.866, sin(60) = 0.5
            { x: -triangleSize * 0.866, y: triangleSize * 0.5 }
          ],
          {
            restitution: 0.5,
            friction: 0.3,
            frictionAir: 0.01,
            density: 0.001,
            render: { fillStyle: '#888', strokeStyle: '#666', lineWidth: 2 },
            label: 'obstacle-triangle' // Special label to prevent merging
          }
        )
      } else {
        // Create circle
        const radius = ANIMAL_TYPES[currentNextIndex].radius
        const currentWidth = render.canvas.width
        x = Math.max(radius + 10, Math.min(x, currentWidth - radius - 10))

        const type = ANIMAL_TYPES[currentNextIndex]
        body = Bodies.circle(x, 50, type.radius, {
          restitution: 0.85, // More bouncy for better side collisions (0.0 = no bounce, 1.0 = full bounce)
          friction: 0.1, // Lower friction for more sliding/bouncing between balls
          frictionAir: 0.01, // Normal air resistance
          density: 0.001, // Normal density
          render: { fillStyle: type.color },
          label: `animal-${currentNextIndex}` // Store level in label
        })
      }

      // Add initial velocity based on charge and curve
      Body.setVelocity(body, { 
        x: curveStrength, 
        y: launchVelocity 
      })

      Composite.add(engine.world, body)

      // Reset charge
      setCharge(0)
      currentCharge = 0

      // Cooldown
      canDrop = false
      setTimeout(() => {
        canDrop = true
        // Determine next shape and animal
        currentNextShapeType = getNextShapeType()
        setNextShapeType(currentNextShapeType)
        if (currentNextShapeType === 'circle') {
          currentNextIndex = Math.floor(Math.random() * 3)
          setNextAnimalIndex(currentNextIndex)
        }
      }, 500)
    }

    // Attach event listeners
    const element = sceneRef.current
    element.addEventListener('mousedown', handleChargeStart)
    element.addEventListener('mouseup', handleChargeRelease)
    element.addEventListener('touchstart', handleChargeStart)
    element.addEventListener('touchend', handleChargeRelease)
    
      // Also handle mouse leave to cancel charge
      const handleMouseLeave = () => {
        if (isChargingRef.current) {
          isChargingRef.current = false
          setIsCharging(false)
          setCharge(0)
          currentCharge = 0
          currentChargeRef.current = 0
          if (chargeIntervalRef.current) {
            clearTimeout(chargeIntervalRef.current)
            chargeIntervalRef.current = null
          }
        }
      }
      element.addEventListener('mouseleave', handleMouseLeave)

    // --- COLLISION MERGING ---
    Events.on(engine, 'collisionStart', (event) => {
      const pairs = event.pairs
      const largestSizeLevel = ANIMAL_TYPES.length - 2 // Second-to-last level (XL, index 4)
      const processedBodies = new Set<Matter.Body>()

      for (let i = 0; i < pairs.length; i++) {
        const bodyA = pairs[i].bodyA
        const bodyB = pairs[i].bodyB

        // Skip if already processed
        if (processedBodies.has(bodyA) || processedBodies.has(bodyB)) {
          continue
        }

        // Check if both are animals and same level
        if (bodyA.label.startsWith('animal-') && bodyB.label.startsWith('animal-')) {
          const levelA = parseInt(bodyA.label.split('-')[1])
          const levelB = parseInt(bodyB.label.split('-')[1])

          if (levelA === levelB) {
            // Special case: If two largest sizes (XL) collide, check for a third nearby
            if (levelA === largestSizeLevel) {
              // Find all bodies of the same level
              const allBodies = Composite.allBodies(engine.world)
              const sameLevelBodies = allBodies.filter(b => {
                if (!b.label.startsWith('animal-')) return false
                const level = parseInt(b.label.split('-')[1])
                return level === levelA && b !== bodyA && b !== bodyB
              })

              // Check if any third body is nearby (within reasonable distance)
              const searchRadius = ANIMAL_TYPES[levelA].radius * 3 // 3x radius for proximity
              let thirdBody: Matter.Body | null = null

              for (const candidate of sameLevelBodies) {
                const distA = Math.sqrt(
                  Math.pow(candidate.position.x - bodyA.position.x, 2) +
                  Math.pow(candidate.position.y - bodyA.position.y, 2)
                )
                const distB = Math.sqrt(
                  Math.pow(candidate.position.x - bodyB.position.x, 2) +
                  Math.pow(candidate.position.y - bodyB.position.y, 2)
                )

                // If the third body is close to either of the colliding bodies
                if (distA < searchRadius || distB < searchRadius) {
                  thirdBody = candidate
                  break
                }
              }

              if (thirdBody && !processedBodies.has(thirdBody)) {
                // Merge all three into the final size (Panda)
                Composite.remove(engine.world, [bodyA, bodyB, thirdBody])
                processedBodies.add(bodyA)
                processedBodies.add(bodyB)
                processedBodies.add(thirdBody)

                // Create new body at center of three
                const centerX = (bodyA.position.x + bodyB.position.x + thirdBody.position.x) / 3
                const centerY = (bodyA.position.y + bodyB.position.y + thirdBody.position.y) / 3
                const finalLevel = ANIMAL_TYPES.length - 1 // Panda level
                const finalType = ANIMAL_TYPES[finalLevel]

                const newBody = Bodies.circle(centerX, centerY, finalType.radius, {
                  restitution: 0.85, // Match increased bounciness for side collisions
                  friction: 0.1, // Lower friction for more bouncing
                  frictionAir: 0.01,
                  density: 0.001,
                  render: { fillStyle: finalType.color },
                  label: `animal-${finalLevel}`
                })

                Composite.add(engine.world, newBody)
                setScore(prev => prev + finalType.score)
                continue // Skip normal merge logic
              }
            }

            // Normal merge: two of the same level (but not largest size, or no third found)
            // Special case: XL (largestSizeLevel) only merges when three are together
            if (levelA < ANIMAL_TYPES.length - 1 && levelA !== largestSizeLevel) {
              // Remove old bodies
              Composite.remove(engine.world, [bodyA, bodyB])
              processedBodies.add(bodyA)
              processedBodies.add(bodyB)

              // Create new body at midpoint
              const midX = (bodyA.position.x + bodyB.position.x) / 2
              const midY = (bodyA.position.y + bodyB.position.y) / 2
              const nextLevel = levelA + 1
              const nextType = ANIMAL_TYPES[nextLevel]

              const newBody = Bodies.circle(midX, midY, nextType.radius, {
                restitution: 0.85, // Match increased bounciness for side collisions
                friction: 0.1, // Lower friction for more bouncing
                frictionAir: 0.01,
                density: 0.001,
                render: { fillStyle: nextType.color },
                label: `animal-${nextLevel}`
              })

              Composite.add(engine.world, newBody)
              setScore(prev => prev + nextType.score)
            }
            // If two XL circles collide but no third is found, they don't merge (stay as two XL circles)
          }
        }
      }
    })

    // --- GAME OVER CHECK ---
    // Check if any body is above the line for too long
    // Ideally use 'collisionActive' with a sensor line, or just check positions
    // Simple check: every second, check if any STATIC/SLEEPING body is above y=100
    // Actually, just checking if velocity is low and y < 100
    const checkGameOver = () => {
      const bodies = Composite.allBodies(engine.world)
      // Filter out walls/ground
      const animals = bodies.filter(b => b.label.startsWith('animal-'))
      
      for (const animal of animals) {
        if (animal.position.y < 100 && Math.abs(animal.velocity.y) < 0.1 && Math.abs(animal.velocity.x) < 0.1) {
          // It's stacked high and stable-ish
          // Give a grace period? For simplicity, immediate game over if stable high
          // But usually there's a timer.
          // Let's rely on a simplified "top line" trigger
          setIsGameOver(true)
          Runner.stop(runner)
          // onGameOver(score) // Don't call here directly to avoid closure stale state issues if using score from state
          // We'll handle score saving in a useEffect dependent on isGameOver
          break
        }
      }
    }

    const interval = setInterval(checkGameOver, 1000)

    // Run
    Render.run(render)
    const runner = Runner.create()
    Runner.run(runner, engine)

    // Make canvas full width but maintain aspect ratio
    if (render.canvas) {
      render.canvas.style.width = '100%'
      render.canvas.style.height = 'auto'
      render.canvas.style.maxHeight = `${GAME_HEIGHT}px`
    }

    return () => {
      Render.stop(render)
      Runner.stop(runner)
      if (render.canvas) render.canvas.remove()
      element.removeEventListener('mousedown', handleChargeStart)
      element.removeEventListener('mouseup', handleChargeRelease)
      element.removeEventListener('mouseleave', handleMouseLeave)
      element.removeEventListener('touchstart', handleChargeStart)
      element.removeEventListener('touchend', handleChargeRelease)
      clearInterval(interval)
      if (chargeIntervalRef.current) {
        clearTimeout(chargeIntervalRef.current)
      }
    }
  }, [gameWidth, gameKey]) // Re-run when width changes or game restarts

  // Handle Game Over Score Save
  useEffect(() => {
    if (isGameOver) {
      onGameOver(score)
    }
  }, [isGameOver, score, onGameOver])

  // Fetch leaderboard when modal opens
  useEffect(() => {
    if (isLeaderboardOpen && leaderboard.length === 0) {
      setIsLoadingLeaderboard(true)
      fetch('/api/game/leaderboard')
        .then(res => res.json())
        .then(data => {
          if (data.leaderboard) {
            setLeaderboard(data.leaderboard)
          }
        })
        .catch(err => {
          console.error('Failed to fetch leaderboard:', err)
        })
        .finally(() => {
          setIsLoadingLeaderboard(false)
        })
    }
  }, [isLeaderboardOpen, leaderboard.length])

  const restartGame = () => {
    setIsGameOver(false)
    setScore(0)
    setCharge(0)
    setIsCharging(false)
    isChargingRef.current = false
    currentChargeRef.current = 0
    if (chargeIntervalRef.current) {
      clearTimeout(chargeIntervalRef.current)
      chargeIntervalRef.current = null
    }
    // Force remount by changing key - this will restart the entire game
    setGameKey(prev => prev + 1)
  }

  return (
    <div key={gameKey} className="relative w-full h-full flex flex-col bg-slate-50 dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b dark:border-zinc-800 bg-white dark:bg-zinc-900 z-10 w-full relative">
        <div>
          <p className="text-xs font-bold text-zinc-500 uppercase">Score</p>
          <p className="text-xl font-bold font-mono">{score}</p>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Penda Plop</h1>
          {onExit && (
            <button
              onClick={onExit}
              className="text-xs px-3 py-1 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-full transition-colors text-zinc-700 dark:text-zinc-300"
            >
              Exit Game
            </button>
          )}
        </div>
        <div>
          <p className="text-xs font-bold text-zinc-500 uppercase text-right">Best</p>
          <p className="text-xl font-bold font-mono text-right">{Math.max(score, currentHighScore)}</p>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 relative w-full" ref={sceneRef}>
        {/* Next Shape Indicator */}
        {!isGameOver && nextShapeType === 'circle' && (
          <div 
            className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none opacity-50"
            style={{
              width: ANIMAL_TYPES[nextAnimalIndex].radius * 2,
              height: ANIMAL_TYPES[nextAnimalIndex].radius * 2,
              backgroundColor: ANIMAL_TYPES[nextAnimalIndex].color,
              borderRadius: '50%',
            }}
          />
        )}
        {!isGameOver && nextShapeType === 'triangle' && (
          <div 
            className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none opacity-50"
            style={{
              width: 50 * CIRCLE_SCALE * 2,
              height: 50 * CIRCLE_SCALE * 2,
            }}
          >
            <Triangle 
              className="w-full h-full text-zinc-600 dark:text-zinc-400" 
              fill="currentColor"
            />
          </div>
        )}
        
        {/* Drop Line */}
        <div className="absolute top-[50px] left-0 w-full border-t border-dashed border-red-300 pointer-events-none opacity-50" />

        {/* Leaderboard Button - Bottom Left */}
        <button
          onClick={() => setIsLeaderboardOpen(true)}
          className="absolute bottom-4 left-4 z-20 p-3 bg-white dark:bg-zinc-800 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 border border-zinc-200 dark:border-zinc-700"
          aria-label="View Leaderboard"
        >
          <Trophy className="h-5 w-5 text-yellow-500" />
        </button>
      </div>

      {/* Charge Meter */}
      {isCharging && (
        <div 
          className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
          style={{ left: `${chargePosition.x}px`, top: `${chargePosition.y - 60}px` }}
        >
          <div className="bg-black/80 rounded-lg px-3 py-2 backdrop-blur-sm">
            <div className="w-32 h-3 bg-zinc-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 transition-all duration-75"
                style={{ width: `${charge * 100}%` }}
              />
            </div>
            <p className="text-xs text-white text-center mt-1 font-mono">
              {Math.round(charge * 100)}%
            </p>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {isGameOver && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
          <h2 className="text-3xl font-bold text-white mb-2">Game Over!</h2>
          <p className="text-xl text-white mb-6">Score: {score}</p>
          <Button onClick={restartGame} variant="secondary">
            <RotateCcw className="mr-2 h-4 w-4" /> Play Again
          </Button>
        </div>
      )}

      {/* Leaderboard Modal */}
      <AnimatePresence>
        {isLeaderboardOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsLeaderboardOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Leaderboard</h2>
                </div>
                <button
                  onClick={() => setIsLeaderboardOpen(false)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Leaderboard List */}
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                {isLoadingLeaderboard ? (
                  <div className="p-8 text-center text-zinc-500">Loading leaderboard...</div>
                ) : leaderboard.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500">No scores yet. Be the first!</div>
                ) : (
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {leaderboard.map((entry, index) => (
                      <div
                        key={entry.id}
                        className="p-4 flex items-center gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                      >
                        {/* Rank */}
                        <div className="flex-shrink-0 w-8 text-center">
                          <span
                            className={`text-lg font-bold ${
                              index === 0
                                ? 'text-yellow-500'
                                : index === 1
                                ? 'text-zinc-400'
                                : index === 2
                                ? 'text-amber-600'
                                : 'text-zinc-500 dark:text-zinc-400'
                            }`}
                          >
                            {index + 1}
                          </span>
                        </div>

                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          {entry.image ? (
                            <img
                              src={entry.image}
                              alt={entry.name || 'User'}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                              <span className="text-zinc-500 dark:text-zinc-400 font-semibold text-sm">
                                {(entry.name || 'U')[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Name and Score */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {entry.name || 'Anonymous'}
                          </p>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {entry.highScore.toLocaleString()} points
                          </p>
                        </div>

                        {/* Trophy Icon for Top 3 */}
                        {index < 3 && (
                          <div className="flex-shrink-0">
                            <Trophy
                              className={`h-5 w-5 ${
                                index === 0
                                  ? 'text-yellow-500'
                                  : index === 1
                                  ? 'text-zinc-400'
                                  : 'text-amber-600'
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

