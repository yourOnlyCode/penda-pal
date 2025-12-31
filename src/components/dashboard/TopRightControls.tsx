'use client'

import { DarkModeToggle } from './DarkModeToggle'
import { SignOutButton } from './SignOutButton'

export function TopRightControls() {
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
      <DarkModeToggle />
      <SignOutButton />
    </div>
  )
}

