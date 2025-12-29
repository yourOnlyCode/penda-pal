import { prisma } from './prisma'

function calculateCompatibility(userInterests: string[], candidateInterests: string[]): number {
  if (!userInterests.length || !candidateInterests.length) return 0
  
  const userSet = new Set(userInterests.map(i => i.toLowerCase()))
  const candidateSet = new Set(candidateInterests.map(i => i.toLowerCase()))
  
  let sharedInterests = 0
  userSet.forEach(interest => {
    if (candidateSet.has(interest)) sharedInterests++
  })
  
  // Score: shared interests / average of both interest counts
  const avgInterests = (userInterests.length + candidateInterests.length) / 2
  return sharedInterests / avgInterests
}

export async function findAndMatchPenpal(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isMinor: true, isVerified: true, interests: true },
  })

  if (!user) return null

  // Check if user already has active penpal
  const existingPenpal = await prisma.penpal.findFirst({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
      status: 'active',
    },
  })

  if (existingPenpal && !user.isVerified) return null // Non-verified can only have 1 penpal

  // Find all compatible users from waitlist (same age group)
  const candidates = await prisma.waitlist.findMany({
    where: {
      isMinor: user.isMinor,
      userId: { not: userId },
    },
    include: {
      user: {
        select: { id: true, interests: true },
      },
    },
  })

  if (candidates.length === 0) {
    // Add to waitlist
    await prisma.waitlist.upsert({
      where: { userId },
      create: { userId, isMinor: user.isMinor },
      update: {},
    })
    return null
  }

  // Calculate compatibility scores and find best match
  let bestMatch = candidates[0]
  let bestScore = calculateCompatibility(user.interests, candidates[0].user.interests)

  for (let i = 1; i < candidates.length; i++) {
    const score = calculateCompatibility(user.interests, candidates[i].user.interests)
    if (score > bestScore) {
      bestScore = score
      bestMatch = candidates[i]
    }
  }

  // Create penpal relationship
  const twoWeeksFromNow = new Date()
  twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14)

  const penpal = await prisma.penpal.create({
    data: {
      user1Id: userId,
      user2Id: bestMatch.userId,
      canCancelAt: twoWeeksFromNow,
    },
  })

  // Remove both from waitlist
  await prisma.waitlist.deleteMany({
    where: { userId: { in: [userId, bestMatch.userId] } },
  })

  return penpal
}

export async function cancelPenpal(userId: string, penpalId: string, reason?: string) {
  const penpal = await prisma.penpal.findUnique({
    where: { id: penpalId },
  })

  if (!penpal) return null

  const now = new Date()
  if (now < penpal.canCancelAt) {
    throw new Error('Cannot cancel before 2 weeks')
  }

  await prisma.penpal.update({
    where: { id: penpalId },
    data: {
      status: 'cancelled',
      cancelledBy: userId,
      cancelReason: reason,
    },
  })

  // Try to match with new penpal
  return await findAndMatchPenpal(userId)
}
