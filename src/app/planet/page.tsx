import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PendaPlanetClient } from '@/components/planet/PendaPlanetClient'
import { PendaPurse } from '@/components/PendaPurse'

export default async function PlanetPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  return (
    <div className="w-full h-screen">
      <PendaPlanetClient />
      <PendaPurse />
    </div>
  )
}

