/**
 * Profit/Loss Calculator for Trading Desk
 * Tracks performance of value plays (value score > 25)
 */

export interface PLData {
  totalValuePlays: number;
  winners: number;  // 1st place only
  winRate: number;  // Percentage of 1st place finishes
  totalStaked: number;
  totalReturns: number;
  profitLoss: number;
  roi: number;
}

export interface HorseResult {
  rating: number;
  price: number;
  actual_sp?: number | null;
  finishing_position?: number | null;
}

const STAKE_AMOUNT = 10;

/**
 * Calculate return for a single horse bet
 * Only returns on 1st place wins
 */
export function calculateReturn(
  finishingPosition: number | null | undefined,
  price: number,
  actual_sp: number | null | undefined
): number {
  if (!finishingPosition) return 0;

  const oddsToUse = actual_sp && actual_sp > 0 ? actual_sp : price;

  // Only return on 1st place wins
  if (finishingPosition === 1) {
    return STAKE_AMOUNT * oddsToUse;
  }

  return 0; // No return for 2nd, 3rd, or worse
}

/**
 * Calculate P&L statistics for a set of horses
 * Only includes horses with value score > 25 AND have completed their race
 * Winners = 1st place finishes only
 */
export function calculatePL(horses: HorseResult[]): PLData {
  const valuePlays = horses.filter(horse => {
    if (horse.price <= 0 || !horse.rating) return false;
    // Only include horses that have actually raced (have a finishing position)
    if (!horse.finishing_position) return false;
    const valueScore = (horse.rating / horse.price) * 10;
    return valueScore > 25;
  });

  const totalValuePlays = valuePlays.length;
  const totalStaked = totalValuePlays * STAKE_AMOUNT;

  let totalReturns = 0;
  let winners = 0;

  valuePlays.forEach(horse => {
    const returns = calculateReturn(
      horse.finishing_position,
      horse.price,
      horse.actual_sp
    );
    totalReturns += returns;

    if (horse.finishing_position === 1) {
      winners++;
    }
  });

  const profitLoss = totalReturns - totalStaked;
  const winRate = totalValuePlays > 0 ? (winners / totalValuePlays) * 100 : 0;
  const roi = totalStaked > 0 ? (profitLoss / totalStaked) * 100 : 0;

  return {
    totalValuePlays,
    winners,
    winRate,
    totalStaked,
    totalReturns,
    profitLoss,
    roi,
  };
}
