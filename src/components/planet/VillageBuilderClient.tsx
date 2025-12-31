'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const VillageBuilder = dynamic(() => import('./VillageBuilder').then(mod => ({ default: mod.VillageBuilder })), {
  ssr: false
})

interface VillageBuilderClientProps {
  villageId: string
  villageName: string
  userVerified: boolean
}

export function VillageBuilderClient({ villageId, villageName, userVerified }: VillageBuilderClientProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="w-full h-screen bg-gradient-to-b from-green-50 to-blue-50 dark:from-zinc-900 dark:to-zinc-800 flex items-center justify-center">
        <div className="text-zinc-900 dark:text-zinc-100 text-xl">Loading Village...</div>
      </div>
    )
  }

  return <VillageBuilder villageId={villageId} villageName={villageName} userVerified={userVerified} />
}

