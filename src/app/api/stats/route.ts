import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const userCount = await prisma.user.count()
    return NextResponse.json({ count: userCount })
  } catch (error) {
    return NextResponse.json({ count: 0 })
  }
}
