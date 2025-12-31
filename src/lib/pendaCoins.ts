import { prisma } from './prisma'

/**
 * Award Penda Coins to a user
 * @param userId - The user ID to award coins to
 * @param amount - The amount of coins to award
 * @param reason - Optional reason for the award (for logging)
 * @returns The new coin balance
 */
export async function awardPendaCoins(
  userId: string,
  amount: number,
  reason?: string
): Promise<number> {
  if (amount <= 0) {
    throw new Error('Amount must be positive')
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      pendaCoins: {
        increment: amount
      }
    },
    select: {
      pendaCoins: true
    }
  })

  // Log the award (optional, for future analytics)
  if (reason) {
    console.log(`Awarded ${amount} Penda Coins to user ${userId} for: ${reason}`)
  }

  return user.pendaCoins
}

/**
 * Get user's current Penda Coin balance
 */
export async function getPendaCoins(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pendaCoins: true }
  })

  return user?.pendaCoins || 0
}

/**
 * Deduct Penda Coins from a user's balance
 * @param userId - The user ID to deduct coins from
 * @param amount - The amount of coins to deduct
 * @param reason - Optional reason for the deduction (for logging)
 * @returns The new coin balance, or null if insufficient funds
 */
export async function deductPendaCoins(
  userId: string,
  amount: number,
  reason?: string
): Promise<number | null> {
  if (amount <= 0) {
    throw new Error('Amount must be positive')
  }

  // Check current balance
  const currentBalance = await getPendaCoins(userId)
  
  if (currentBalance < amount) {
    // Insufficient funds
    if (reason) {
      console.log(`Insufficient Penda Coins for user ${userId} (has ${currentBalance}, needs ${amount}) for: ${reason}`)
    }
    return null
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      pendaCoins: {
        decrement: amount
      }
    },
    select: {
      pendaCoins: true
    }
  })

  // Log the deduction (optional, for future analytics)
  if (reason) {
    console.log(`Deducted ${amount} Penda Coins from user ${userId} for: ${reason}`)
  }

  return user.pendaCoins
}

