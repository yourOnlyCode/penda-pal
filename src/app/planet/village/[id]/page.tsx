import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/authOptions'
import { VillageBuilderClient } from '@/components/planet/VillageBuilderClient'
import { PendaPurse } from '@/components/PendaPurse'
import { prisma } from '@/lib/prisma'

interface VillagePageProps {
  params: {
    id: string
  }
}

export default async function VillagePage({ params }: VillagePageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // Fetch user data to check verification
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isVerified: true }
  })

  // Fetch village name from first lot (or use default)
  const firstLot = await prisma.lot.findFirst({
    where: { villageId: params.id },
    select: { villageName: true }
  })

  const villageName = firstLot?.villageName || `Village ${params.id}`

  return (
    <div className="w-full h-screen">
      <VillageBuilderClient 
        villageId={params.id} 
        villageName={villageName}
        userVerified={user?.isVerified || false} 
      />
      <PendaPurse />
    </div>
  )
}

