import { prisma } from './prisma'

function calculateCompatibility(
  userInterests: string[],
  candidateInterests: string[],
  userActivities: string[] = [],
  candidateActivities: string[] = []
): number {
  if (!userInterests.length || !candidateInterests.length) return 0
  
  const userInterestSet = new Set(userInterests.map(i => i.toLowerCase().trim()))
  const candidateInterestSet = new Set(candidateInterests.map(i => i.toLowerCase().trim()))
  
  // Count shared interests (HEAVILY weighted - 70% of score)
  let sharedInterests = 0
  userInterestSet.forEach(interest => {
    if (candidateInterestSet.has(interest)) sharedInterests++
  })
  
  // Count shared activities (20% of score)
  let sharedActivities = 0
  if (userActivities.length > 0 && candidateActivities.length > 0) {
    const userActivitySet = new Set(userActivities.map(a => a.toLowerCase().trim()))
    const candidateActivitySet = new Set(candidateActivities.map(a => a.toLowerCase().trim()))
    userActivitySet.forEach(activity => {
      if (candidateActivitySet.has(activity)) sharedActivities++
    })
  }
  
  // Interest compatibility (70% weight) - heavily considered
  const interestScore = sharedInterests / Math.max(userInterests.length, candidateInterests.length, 1)
  
  // Activity compatibility (20% weight)
  const activityScore = userActivities.length > 0 && candidateActivities.length > 0
    ? sharedActivities / Math.max(userActivities.length, candidateActivities.length, 1)
    : 0
  
  // Diversity bonus (10% weight) - slight bonus for having some different interests
  const diversityBonus = Math.min(
    (userInterests.length + candidateInterests.length - sharedInterests * 2) / 
    Math.max(userInterests.length + candidateInterests.length, 1),
    0.1
  )
  
  // Weighted final score (interests are HEAVILY considered)
  const finalScore = (interestScore * 0.7) + (activityScore * 0.2) + (diversityBonus * 0.1)
  
  return finalScore
}

export async function findAndMatchPenpal(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      isMinor: true, 
      isVerified: true, 
      interests: true,
      activities: true,
    },
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
        select: { 
          id: true, 
          interests: true,
          activities: true,
        },
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

  // Calculate compatibility scores (HEAVILY considering interests) and find best match
  let bestMatch = candidates[0]
  let bestScore = calculateCompatibility(
    user.interests, 
    candidates[0].user.interests,
    user.activities,
    candidates[0].user.activities
  )

  for (let i = 1; i < candidates.length; i++) {
    const score = calculateCompatibility(
      user.interests, 
      candidates[i].user.interests,
      user.activities,
      candidates[i].user.activities
    )
    if (score > bestScore) {
      bestScore = score
      bestMatch = candidates[i]
    }
  }

  // Only match if there's a reasonable compatibility score (at least some shared interests)
  if (bestScore < 0.1) {
    // Add to waitlist if no good match
    await prisma.waitlist.upsert({
      where: { userId },
      create: { userId, isMinor: user.isMinor },
      update: {},
    })
    return null
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
