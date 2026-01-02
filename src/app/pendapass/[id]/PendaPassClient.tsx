'use client'

import { useState, useRef, useCallback } from 'react'
import { PendaPass } from '@/components/dashboard/PendaPass'
import { FloatingDock } from '@/components/dashboard/FloatingDock'

interface PendaPassClientProps {
  viewedUser: any
  isOwnProfile: boolean
  activePenpal: any
  penpalUser: any
  activePenpalId?: string
}

export default function PendaPassClient({ 
  viewedUser, 
  isOwnProfile, 
  activePenpal, 
  penpalUser,
  activePenpalId 
}: PendaPassClientProps) {
  const gameModeToggleRef = useRef<(() => void) | null>(null)
  const [, forceUpdate] = useState({})

  // Memoize the callback to prevent infinite loops
  const handleGameModeToggleRef = useCallback((toggle: () => void) => {
    gameModeToggleRef.current = toggle
    // Force a re-render so FloatingDock gets the updated function
    forceUpdate({})
  }, [])

  return (
    <>
      <PendaPass 
        user={viewedUser} 
        isOwnProfile={isOwnProfile} 
        activePenpalId={activePenpalId}
        onGameModeToggleRef={handleGameModeToggleRef}
      />
      {isOwnProfile && (
        <FloatingDock 
          user={viewedUser} 
          activePenpal={activePenpal} 
          penpalUser={penpalUser}
          onGameModeToggle={gameModeToggleRef.current || undefined}
        />
      )}
    </>
  )
}

