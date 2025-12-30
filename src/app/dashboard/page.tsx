import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PendaPass } from '@/components/dashboard/PendaPass'
import { FloatingDock } from '@/components/dashboard/FloatingDock'
import { prisma } from '@/lib/prisma'
import { Sparkles } from 'lucide-react'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // Get user count for disclaimer
  const userCount = await prisma.user.count().catch(() => 0)

  // Get user with profile data
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
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

  if (!user) {
    redirect('/auth/signin')
  }

  // Get active penpal (if any)
  // Using type assertion to bypass strict type checking for now due to relation complexity
  const userWithRelations = user as any
  const activePenpal = userWithRelations.penpalsAsUser1?.[0] || userWithRelations.penpalsAsUser2?.[0]
  const penpalUser = activePenpal
    ? 'user1Id' in activePenpal && activePenpal.user1Id === user.id
      ? activePenpal.user2
      : activePenpal.user1
    : null

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-black relative overflow-hidden flex flex-col items-center justify-center py-20 pb-32">
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
            user={user} 
            isOwnProfile={true} 
            activePenpalId={activePenpal?.id} 
          />
        </div>

        {/* Floating Dock for Mailbox/Request */}
        <FloatingDock 
          user={user} 
          activePenpal={activePenpal} 
          penpalUser={penpalUser} 
        />
      </div>
    </div>
  )
}
