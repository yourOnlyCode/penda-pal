'use client'

import { PendaPass } from './PendaPass'
import { FloatingDock } from './FloatingDock'
import { User } from '@prisma/client'

interface PendaPassWrapperProps {
  user: User & {
    coverImage?: string | null
    city?: string | null
    country?: string | null
    placesVisited?: string[]
    placesWishlist?: string[]
    pendapassTheme?: string | null
    highScore?: number | null
    pendaCoins?: number | null
  }
  isOwnProfile?: boolean
  activePenpalId?: string
  activePenpal?: any
  penpalUser?: any
}

export function PendaPassWrapper({ 
  user, 
  isOwnProfile, 
  activePenpalId, 
  activePenpal, 
  penpalUser 
}: PendaPassWrapperProps) {
  const [gameModeToggle, setGameModeToggle] = useState<(() => void) | null>(null)

  return (
    <>
      <PendaPass 
        user={user} 
        isOwnProfile={isOwnProfile} 
        activePenpalId={activePenpalId}
        onGameModeToggleRef={(toggle) => setGameModeToggle(() => toggle)}
      />
      {isOwnProfile && (
        <FloatingDock 
          user={user} 
          activePenpal={activePenpal} 
          penpalUser={penpalUser}
          onGameModeToggle={gameModeToggle || undefined}
        />
      )}
    </>
  )
}

