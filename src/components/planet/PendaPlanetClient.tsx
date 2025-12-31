'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'

// Dynamically import to avoid SSR issues with Three.js
const PendaPlanet = dynamic(() => import('./PendaPlanet').then(mod => ({ default: mod.PendaPlanet })), {
  ssr: false,
})

export function PendaPlanetClient() {
  const [isMounted, setIsMounted] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="w-full h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading Penda Planet...</div>
      </div>
    )
  }

  return <PendaPlanet userId={session?.user?.id} />
}

