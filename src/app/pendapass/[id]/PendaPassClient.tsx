'use client'

import { useState, useEffect } from 'react'
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
  const [gameModeToggle, setGameModeToggle] = useState<(() => void) | null>(null)

  return (
    <>
      <PendaPass 
        user={viewedUser} 
        isOwnProfile={isOwnProfile} 
        activePenpalId={activePenpalId}
        onGameModeToggleRef={(toggle) => setGameModeToggle(() => toggle)}
      />
      {isOwnProfile && (
        <FloatingDock 
          user={viewedUser} 
          activePenpal={activePenpal} 
          penpalUser={penpalUser}
          onGameModeToggle={gameModeToggle || undefined}
        />
      )}
    </>
  )
}

