import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q') || ''

    if (!query || query.length < 1) {
      return NextResponse.json({ interests: [] })
    }

    // Get all users with their interests
    const users = await prisma.user.findMany({
      where: {
        interests: {
          isEmpty: false,
        },
      },
      select: {
        interests: true,
      },
    })

    // Count occurrences of each interest that matches the query
    const interestCounts = new Map<string, number>()
    const lowerQuery = query.toLowerCase()
    
    users.forEach(user => {
      user.interests.forEach(interest => {
        const lowerInterest = interest.toLowerCase()
        
        // Check if interest contains the query
        if (lowerInterest.includes(lowerQuery)) {
          interestCounts.set(
            interest,
            (interestCounts.get(interest) || 0) + 1
          )
        }
      })
    })

    // Convert to array and sort by count (descending) then alphabetically
    const suggestions = Array.from(interestCounts.entries())
      .map(([interest, count]) => ({ interest, count }))
      .sort((a, b) => {
        // First sort by count (descending)
        if (b.count !== a.count) {
          return b.count - a.count
        }
        // Then alphabetically
        return a.interest.localeCompare(b.interest)
      })
      .slice(0, 10) // Limit to top 10 suggestions

    return NextResponse.json({ interests: suggestions })
  } catch (error: any) {
    console.error('Search interests error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

