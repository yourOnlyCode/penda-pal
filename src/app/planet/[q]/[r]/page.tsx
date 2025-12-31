import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import Link from 'next/link'

interface HexagonPageProps {
  params: {
    q: string
    r: string
  }
}

export default async function HexagonPage({ params }: HexagonPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const q = parseInt(params.q)
  const r = parseInt(params.r)

  // TODO: Fetch hexagon data from database
  // For now, we'll just display the coordinates

  return (
    <div className="w-full h-screen bg-gradient-to-b from-green-50 to-blue-50 dark:from-zinc-900 dark:to-zinc-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link 
            href="/planet"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline mb-4"
          >
            ← Back to Planet
          </Link>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Hexagon ({q}, {r})
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Build your home on this piece of land
          </p>
        </div>

        {/* Hexagon Info */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Hexagon Details
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Coordinates</p>
              <p className="text-lg font-mono text-zinc-900 dark:text-zinc-100">
                Q: {q}, R: {r}
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Terrain</p>
              <p className="text-lg text-zinc-900 dark:text-zinc-100">
                Land
              </p>
            </div>
          </div>
        </div>

        {/* Building Grid - Placeholder */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Building Grid
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Square grid system for placing buildings will be implemented here.
          </p>
          <div className="mt-4 p-8 border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg text-center">
            <p className="text-zinc-500 dark:text-zinc-400">
              Grid system coming soon...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

