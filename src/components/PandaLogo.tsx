'use client'

import Image from 'next/image'
import { useState } from 'react'

export function PandaLogo() {
  const [imageError, setImageError] = useState(false)
  
  // Set this to your panda icon path in the /public folder
  // Supported formats: PNG, SVG, JPG, WEBP
  const pandaIconPath = '/panda-icon.png'

  if (imageError) {
    // Fallback to emoji if image doesn't exist
    return (
      <span className="emoji inline-block animate-bounce text-6xl sm:text-7xl">
        🐼
      </span>
    )
  }

  return (
    <span className="inline-block animate-bounce">
      <Image
        src={pandaIconPath}
        alt="Panda mascot"
        width={80}
        height={80}
        className="h-16 w-16 sm:h-20 sm:w-20"
        onError={() => setImageError(true)}
        priority
      />
    </span>
  )
}

