'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PendaPass } from '@/components/dashboard/PendaPass'
import { FloatingDock } from '@/components/dashboard/FloatingDock'
import { PenpalOptions } from '@/components/dashboard/PenpalOptions'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface PendaPassClientProps {
  viewedUser: any
  isOwnProfile: boolean
  activePenpal: any
  penpalUser: any
  activePenpalId?: string
  isViewingPenpal?: boolean
  currentUserId: string
}

export default function PendaPassClient({ 
  viewedUser, 
  isOwnProfile, 
  activePenpal, 
  penpalUser,
  activePenpalId,
  isViewingPenpal = false,
  currentUserId
}: PendaPassClientProps) {
  const router = useRouter()
  const gameModeToggleRef = useRef<(() => void) | null>(null)
  const [, forceUpdate] = useState({})

  // Memoize the callback to prevent infinite loops
  const handleGameModeToggleRef = useCallback((toggle: () => void) => {
    gameModeToggleRef.current = toggle
    // Force a re-render so FloatingDock gets the updated function
    forceUpdate({})
  }, [])

  // When viewing penpal's PendaPass, use column layout
  if (isViewingPenpal) {
    return (
      <div className="w-full flex flex-col items-center gap-6">
        {/* PendaPass on top center */}
        <PendaPass 
          user={viewedUser} 
          isOwnProfile={isOwnProfile} 
          activePenpalId={activePenpalId}
          onGameModeToggleRef={handleGameModeToggleRef}
        />
        
        {/* Penpal Options below PendaPass */}
        {activePenpal && (
          <PenpalOptions
            penpalId={activePenpal.id}
            penpalUserId={viewedUser.id}
            currentUserId={currentUserId}
          />
        )}

        {/* Back to Your PendaPass button at the bottom */}
        <Button
          onClick={() => router.push(`/pendapass/${currentUserId}`)}
          className="flex items-center gap-2"
          variant="outline"
        >
          <ArrowLeft size={16} />
          Back to Your PendaPass
        </Button>
      </div>
    )
  }

  // Own profile layout (unchanged)
  return (
    <>
      <PendaPass 
        user={viewedUser} 
        isOwnProfile={isOwnProfile} 
        activePenpalId={activePenpalId}
        onGameModeToggleRef={handleGameModeToggleRef}
      />
      
      {/* Floating Dock - only shown on own profile */}
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

