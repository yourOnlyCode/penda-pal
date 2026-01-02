import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/authOptions'
import { TopRightControls } from '@/components/dashboard/TopRightControls'
import { prisma } from '@/lib/prisma'
import { Sparkles } from 'lucide-react'
import PendaPassClient from './PendaPassClient'

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
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      coverImage: true,
      city: true,
      country: true,
      placesVisited: true,
      placesWishlist: true,
      pendapassTheme: true,
      highScore: true,
      pendaCoins: true,
      isVerified: true,
      createdAt: true,
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
      {/* Top Right Controls - Dark Mode Toggle and Sign Out */}
      <TopRightControls />
      
      {/* Disclaimer Banner - Fixed Overlay */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50">
        <div className="inline-flex items-center gap-3 rounded-full border bg-white/80 px-4 py-2 text-sm backdrop-blur-sm dark:bg-gray-900/80 shadow-lg">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <span className="font-medium">Matching Pendapals when we reach 1,000 users!</span>
          <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-semibold text-sm">
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
          <PendaPassClient 
            viewedUser={viewedUser} 
            isOwnProfile={isOwnProfile} 
            activePenpal={activePenpal} 
            penpalUser={penpalUser}
            activePenpalId={activePenpal?.id}
          />
        </div>
      </div>
    </div>
  )
}

