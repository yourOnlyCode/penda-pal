import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bio, country, city, favoriteFoods, activities, interests, placesVisited, placesWishlist, pendapassTheme } = await req.json()

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        bio: bio || null,
        country: country || null,
        city: city || null,
        favoriteFoods: favoriteFoods || [],
        activities: activities || [],
        interests: interests || [],
        placesVisited: placesVisited || [],
        placesWishlist: placesWishlist || [],
        pendapassTheme: pendapassTheme || 'purple',
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error: any) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

