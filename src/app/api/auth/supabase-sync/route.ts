import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { supabaseUserId, email, name } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ message: 'User already exists', user: existingUser })
    }

    // Create new user in Prisma
    const newUser = await prisma.user.create({
      data: {
        email,
        name: name || null,
      },
    })

    return NextResponse.json({ message: 'User created', user: newUser }, { status: 201 })
  } catch (error: any) {
    console.error('Supabase sync error:', error)
    
    // Handle Prisma unique constraint errors (duplicate email)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Handle other Prisma errors
    if (error.code && error.code.startsWith('P')) {
      return NextResponse.json(
        { error: 'Database error: ' + (error.message || 'Unknown error') },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

