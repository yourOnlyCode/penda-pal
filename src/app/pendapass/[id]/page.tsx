import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PendaPass } from '@/components/dashboard/PendaPass'
import { FloatingDock } from '@/components/dashboard/FloatingDock'
import { DarkModeToggle } from '@/components/dashboard/DarkModeToggle'
import { prisma } from '@/lib/prisma'
import { Sparkles } from 'lucide-react'

interface PendaPassPageProps {
  params: {
    id: string
  }
}

export default async function PendaPassIdPage({ params }: PendaPassPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // Get user count for disclaimer
  const userCount = await prisma.user.count().catch(() => 0)

  // Get the user whose PendaPass we're viewing
  const viewedUser = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      penpalsAsUser1: {
        where: { status: 'active' },
        include: {
          user2: true,
        },
      },
      penpalsAsUser2: {
        where: { status: 'active' },
        include: {
          user1: true,
        },
      },
      waitlist: {
        select: {
          id: true,
        },
      },
    },
  })

  if (!viewedUser) {
    notFound()
  }

  // Check if this is the current user's own PendaPass
  const isOwnProfile = session.user.id === params.id

  // Get active penpal (if any) - only for own profile
  let activePenpal = null
  let penpalUser = null

  if (isOwnProfile) {
    const userWithRelations = viewedUser as any
    activePenpal = userWithRelations.penpalsAsUser1?.[0] || userWithRelations.penpalsAsUser2?.[0]
    penpalUser = activePenpal
      ? 'user1Id' in activePenpal && activePenpal.user1Id === viewedUser.id
        ? activePenpal.user2
        : activePenpal.user1
      : null
  }

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-black relative overflow-hidden flex flex-col items-center justify-center py-20 pb-32">
      {/* Dark Mode Toggle - Fixed Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <DarkModeToggle />
      </div>
      
      {/* Disclaimer Banner - Fixed Overlay */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
        <div className="inline-flex items-center gap-2 rounded-full border bg-white/80 px-4 py-2 text-sm backdrop-blur-sm dark:bg-gray-900/80 shadow-lg">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <span className="font-medium">Matching Pendapals when we reach 1,000 users!</span>
        </div>
        <div className="mt-2 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm text-sm text-muted-foreground shadow-sm">
            {userCount}/1,000
          </span>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 z-0 opacity-30 dark:opacity-20 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-400/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-400/30 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 z-10 flex flex-col items-center gap-8">
        {/* PendaPass Profile Card */}
        <div className="w-full flex justify-center">
          <PendaPass 
            user={viewedUser} 
            isOwnProfile={isOwnProfile} 
            activePenpalId={activePenpal?.id} 
          />
        </div>

        {/* Floating Dock for Mailbox/Request - Only show for own profile */}
        {isOwnProfile && (
          <FloatingDock 
            user={viewedUser} 
            activePenpal={activePenpal} 
            penpalUser={penpalUser} 
          />
        )}
      </div>
    </div>
  )
}

