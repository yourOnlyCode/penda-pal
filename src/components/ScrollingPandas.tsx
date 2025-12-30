'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'

export function ScrollingPandas() {
  const [pandas, setPandas] = useState<number[]>([])

  useEffect(() => {
    // Create enough pandas to fill the screen width
    if (typeof window !== 'undefined') {
      const count = Math.ceil(window.innerWidth / 60) + 2
      setPandas(Array.from({ length: count }, (_, i) => i))
    }
  }, [])

  return (
    <div className="relative w-full overflow-hidden py-4">
      <div className="flex animate-scroll gap-8">
        {/* First set of pandas */}
        {pandas.map((i) => (
          <div key={i} className="flex-shrink-0">
            <Image
              src="/panda-icon.png"
              alt=""
              width={40}
              height={40}
              className="h-8 w-8 opacity-30 grayscale"
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
              width={40}
              height={40}
              className="h-8 w-8 opacity-30 grayscale"
              aria-hidden="true"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

