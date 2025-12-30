'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { PandaIcon } from '@/components/PandaIcon'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface RequestPenpalButtonProps {
  userId: string
  isPending?: boolean
}

export function RequestPenpalButton({ userId, isPending: initialPending = false }: RequestPenpalButtonProps) {
  const [loading, setLoading] = useState(false)
  const [isPending, setIsPending] = useState(initialPending)
  const [pandas, setPandas] = useState<number[]>([])
  const router = useRouter()
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    // Create pandas for scrolling animation in pending state
    if (isPending && typeof window !== 'undefined') {
      const count = Math.ceil(300 / 24) + 2 // Enough for button width
      setPandas(Array.from({ length: count }, (_, i) => i))
    }
  }, [isPending])

  const handleRequest = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/penpal/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || 'Failed to request penpal')
        return
      }

      const data = await res.json()
      
      if (data.penpal) {
        // Successfully matched!
        setIsPending(false)
        router.push('/chat')
        router.refresh()
      } else {
        // Added to waitlist
        setIsPending(true)
        router.refresh()
      }
    } catch (error) {
      console.error('Request penpal error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        onClick={handleRequest}
        disabled={loading || isPending}
        size="lg"
        className="w-full text-base h-10 rounded-lg relative overflow-hidden"
      >
        <span className="relative z-10 flex items-center justify-center gap-3">
          {loading ? (
            <>
              <div className="animate-spin">
                <PandaIcon size={24} />
              </div>
              <span>Finding your penpal...</span>
            </>
          ) : isPending ? (
            <>
              <span>Penpal Pending</span>
            </>
          ) : (
            <>
              {/* Placeholder space for the animated panda */}
              <span>Request Penpal</span>
            </>
          )}
        </span>
        
        {/* Animated panda overlay - bounces, rolls to right, reappears on left */}
        {!loading && !isPending && (
          <div className="absolute top-1/2 -translate-y-1/2 animate-panda-bounce-roll pointer-events-none">
            <PandaIcon size={28} />
          </div>
        )}
        
        {/* Scrolling monochrome pandas in pending state */}
        {!loading && isPending && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="flex animate-scroll gap-4 h-full items-center">
              {/* First set of pandas */}
              {pandas.map((i) => (
                <div key={i} className="flex-shrink-0">
                  <Image
                    src="/panda-icon.png"
                    alt=""
                    width={20}
                    height={20}
                    className="h-5 w-5 opacity-20 grayscale"
                    aria-hidden="true"
                  />
                </div>
              ))}
              {/* Duplicate set for seamless loop */}
              {pandas.map((i) => (
                <div key={`duplicate-${i}`} className="flex-shrink-0">
                  <Image
                    src="/panda-icon.png"
                    alt=""
                    width={20}
                    height={20}
                    className="h-5 w-5 opacity-20 grayscale"
                    aria-hidden="true"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </Button>
    </div>
  )
}

