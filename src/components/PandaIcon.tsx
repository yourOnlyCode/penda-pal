'use client'

import Image from 'next/image'

interface PandaIconProps {
  className?: string
  size?: number
}

export function PandaIcon({ className = '', size = 32 }: PandaIconProps) {
  return (
    <div 
      className={`relative inline-block ${className} dark:opacity-90`}
      style={{ 
        width: size,
        height: size,
      }}
    >
      {/* Panda icon with purple filter */}
      <div
        style={{ 
          filter: 'brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(240deg) brightness(95%) contrast(85%)',
          width: size,
          height: size,
        }}
      >
        <Image
          src="/panda-icon.png"
          alt="Panda icon"
          width={size}
          height={size}
          className="w-full h-full object-contain"
          priority
        />
      </div>
    </div>
  )
}

