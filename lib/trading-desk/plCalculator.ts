/**
 * Profit/Loss Calculator for Trading Desk
 * Tracks performance of value plays (value score > 25)
 */

export interface PLData {
  totalValuePlays: number;
  winners: number;
  winRate: number;
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
 * Win (1st): $10 × Price
 * Place (2nd/3rd): $10 × (Price / 4) - simplified place dividend
 * Loss (other): $0
 */
export function calculateReturn(
  finishingPosition: number | null | undefined,
  price: number,
  actual_sp: number | null | undefined
): number {
  if (!finishingPosition) return 0;

  const oddsToUse = actual_sp && actual_sp > 0 ? actual_sp : price;

  if (finishingPosition === 1) {
    // Win: full odds
    return STAKE_AMOUNT * oddsToUse;
  } else if (finishingPosition === 2 || finishingPosition === 3) {
    // Place: simplified - quarter of the odds
    return STAKE_AMOUNT * (oddsToUse / 4);
  }

  return 0; // Loss
}

/**
 * Calculate P&L statistics for a set of horses
 * Only includes horses with value score > 25
 */
export function calculatePL(horses: HorseResult[]): PLData {
  const valuePlays = horses.filter(horse => {
    if (horse.price <= 0 || !horse.rating) return false;
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

    if (
      horse.finishing_position === 1 ||
      horse.finishing_position === 2 ||
      horse.finishing_position === 3
    ) {
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
