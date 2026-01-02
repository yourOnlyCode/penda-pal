import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { supabaseUserId, accessToken } = await req.json()

    if (!supabaseUserId || !accessToken) {
      return NextResponse.json(
        { error: 'Supabase user ID and access token are required' },
        { status: 400 }
      )
    }

    // Verify the token and get user info from Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken)

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Find or create user in Prisma
    let dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
    })

    if (!dbUser) {
      // Create user if doesn't exist
      dbUser = await prisma.user.create({
        data: {
          email: user.email!,
          name: user.user_metadata?.name || null,
          image: user.user_metadata?.avatar_url || null,
        },
      })
    }

    // Return user data for NextAuth session creation
    return NextResponse.json({
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        image: dbUser.image,
      },
    })
  } catch (error) {
    console.error('Supabase signin error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

