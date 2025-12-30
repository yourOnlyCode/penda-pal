'use client'

import { useEffect, useState, useRef } from 'react'

const phrases = ['Penda Pal', 'Cuddle Cub', 'Bao Bud']

export function RotatingText() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [key, setKey] = useState(0) // Key to force re-animation
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    
    // Start first animation immediately
    setKey((prev) => prev + 1)
    
    const scheduleNext = () => {
      if (!isMountedRef.current) return
      
      // Wait for the full animation to complete including fade-out
      // Add small buffer (50ms) to ensure fade-out is fully complete
      setTimeout(() => {
        if (!isMountedRef.current) return
        setCurrentIndex((prev) => (prev + 1) % phrases.length)
        // Use requestAnimationFrame to ensure state update before new animation
        requestAnimationFrame(() => {
          if (!isMountedRef.current) return
          setKey((prev) => prev + 1) // Trigger new animation with new word
          scheduleNext() // Schedule the next change
        })
      }, 2050) // Wait 2 seconds + 50ms buffer for fade-out to fully complete
    }
    
    scheduleNext()

    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Find the longest phrase to set fixed width
  const longestPhrase = phrases.reduce((a, b) => (a.length > b.length ? a : b))
  const maxWidth = `${longestPhrase.length * 0.65}em` // Approximate width based on character count

  return (
    <span className="-ml-2 relative inline-block overflow-visible" style={{ width: maxWidth, minWidth: maxWidth, height: '1.2em', verticalAlign: 'baseline' }}>
      {/* Animated text */}
      <span 
        key={key}
        className="phrase-animation absolute left-0 block w-full font-bold text-purple-400 dark:text-purple-300"
      >
        {phrases[currentIndex]}
      </span>
      {/* Fixed width underline - positioned lower below text, thinner and narrower */}
      <span 
        className="absolute left-1/2 bg-purple-400 dark:bg-purple-300" 
        style={{ 
          height: '0.2em', 
          top: '1.6em',
          width: '85%',
          transform: 'translateX(-50%)',
        }} 
      />
    </span>
  )
}

