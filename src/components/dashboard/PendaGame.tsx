'use client'

import { useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'

interface PendaGameProps {
  onGameOver: (score: number) => void
  currentHighScore: number
  onExit?: () => void
}

// Game constants
const GAME_HEIGHT = 450
const WALL_THICKNESS = 40 // Thicker walls to prevent tunneling
const CIRCLE_SCALE = 0.6 // Scale down sizes for the pass

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

    // --- MOUSE CONTROL (for dropping) ---
    // Instead of dragging bodies, we use mouse movement to position a "ghost" dropper
    // and click to spawn. We don't want to drag existing bodies.
    
    // --- GAME LOGIC ---
    let currentNextIndex = Math.floor(Math.random() * 3) // Start with smaller ones
    setNextAnimalIndex(currentNextIndex)
    let canDrop = true

    // Click handler to drop
    const handleInput = (e: MouseEvent | TouchEvent) => {
      if (isGameOver || !canDrop) return

      // Get x position relative to canvas
      const rect = render.canvas.getBoundingClientRect()
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
      let x = clientX - rect.left

      // Clamp x
      const radius = ANIMAL_TYPES[currentNextIndex].radius
      const currentWidth = render.canvas.width
      x = Math.max(radius + 10, Math.min(x, currentWidth - radius - 10))

      // Calculate curve based on click position relative to center
      const centerX = currentWidth / 2
      const offsetFromCenter = x - centerX
      const curveStrength = (offsetFromCenter / centerX) * 3 // Scale the curve effect (max 3 units of velocity)

      // Create body
      const type = ANIMAL_TYPES[currentNextIndex]
      const body = Bodies.circle(x, 50, type.radius, {
        restitution: 0.7, // Bouncy (0.0 = no bounce, 1.0 = full bounce)
        friction: 0.2, // Low friction for more sliding/bouncing
        frictionAir: 0.01, // Normal air resistance
        density: 0.001, // Normal density
        render: { fillStyle: type.color },
        label: `animal-${currentNextIndex}` // Store level in label
      })

      // Add initial horizontal velocity for curve effect
      Body.setVelocity(body, { 
        x: curveStrength, 
        y: 0 
      })

      Composite.add(engine.world, body)

      // Cooldown
      canDrop = false
      setTimeout(() => {
        canDrop = true
        // New next animal
        currentNextIndex = Math.floor(Math.random() * 3)
        setNextAnimalIndex(currentNextIndex)
      }, 500)
    }

    // Attach click listener to canvas wrapper or canvas itself
    // Using render.canvas didn't work well with React useEffect cleanup sometimes, 
    // attaching to the ref element is safer
    const element = sceneRef.current
    element.addEventListener('mousedown', handleInput)
    element.addEventListener('touchstart', handleInput)

    // --- COLLISION MERGING ---
    Events.on(engine, 'collisionStart', (event) => {
      const pairs = event.pairs

      for (let i = 0; i < pairs.length; i++) {
        const bodyA = pairs[i].bodyA
        const bodyB = pairs[i].bodyB

        // Check if both are animals and same level
        if (bodyA.label.startsWith('animal-') && bodyB.label.startsWith('animal-')) {
          const levelA = parseInt(bodyA.label.split('-')[1])
          const levelB = parseInt(bodyB.label.split('-')[1])

          if (levelA === levelB && levelA < ANIMAL_TYPES.length - 1) {
            // Merge!
            // Remove old bodies
            Composite.remove(engine.world, [bodyA, bodyB])
            
            // Create new body at midpoint
            const midX = (bodyA.position.x + bodyB.position.x) / 2
            const midY = (bodyA.position.y + bodyB.position.y) / 2
            const nextLevel = levelA + 1
            const nextType = ANIMAL_TYPES[nextLevel]
            
            const newBody = Bodies.circle(midX, midY, nextType.radius, {
              restitution: 0.7, // Match the bouncy physics of dropped circles
              friction: 0.2,
              frictionAir: 0.01,
              density: 0.001,
              render: { fillStyle: nextType.color },
              label: `animal-${nextLevel}`
            })
            
            Composite.add(engine.world, newBody)
            
            // Update score
            setScore(prev => prev + nextType.score)
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
      element.removeEventListener('mousedown', handleInput)
      element.removeEventListener('touchstart', handleInput)
      clearInterval(interval)
    }
  }, [gameWidth]) // Re-run when width changes

  // Handle Game Over Score Save
  useEffect(() => {
    if (isGameOver) {
      onGameOver(score)
    }
  }, [isGameOver, score, onGameOver])

  const restartGame = () => {
    setIsGameOver(false)
    setScore(0)
    if (engineRef.current) {
      Matter.Composite.clear(engineRef.current.world, false, true) // Keep static bodies (walls)? No, keepStatic=true clears all but static
      // Actually we need to re-add walls if we clear all.
      // Better: remove all bodies with 'animal-' label
      const bodies = Matter.Composite.allBodies(engineRef.current.world)
      const animals = bodies.filter(b => b.label.startsWith('animal-'))
      Matter.Composite.remove(engineRef.current.world, animals)
      
      // Resume runner if stopped
      // We need to re-create runner or just restart?
      // Since we unmounted logic in useEffect cleanup, we probably need to trigger a full remount or handle restart internaly.
      // Easiest is to unmount/remount the component from parent, but here we can't easily.
      // Let's reload the page or just tell parent to toggle game mode?
      // For now, simpler to just "Refresh" via parent key change.
      // But let's try to clear bodies and resume.
      // The useEffect runs only on mount.
      // So we need access to the runner to restart it.
      // Let's just force a remount from parent by passing a key?
      // Or we can reload window location.reload() for MVP "Play Again".
    }
  }

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-50 dark:bg-zinc-900 overflow-hidden">
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
        {/* Next Animal Indicator */}
        {!isGameOver && (
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
        
        {/* Drop Line */}
        <div className="absolute top-[50px] left-0 w-full border-t border-dashed border-red-300 pointer-events-none opacity-50" />
      </div>

      {/* Game Over Overlay */}
      {isGameOver && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
          <h2 className="text-3xl font-bold text-white mb-2">Game Over!</h2>
          <p className="text-xl text-white mb-6">Score: {score}</p>
          <Button onClick={() => window.location.reload()} variant="secondary">
            <RotateCcw className="mr-2 h-4 w-4" /> Play Again
          </Button>
        </div>
      )}
    </div>
  )
}

