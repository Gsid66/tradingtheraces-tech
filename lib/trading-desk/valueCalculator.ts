/**
 * Value Score Calculator
 * Formula: (Rating / Price) * 10 = Value Score
 */

export interface RaceHorse {
  rating: number;
  price: number;
}

export function calculateValueScore(rating: number, price: number): number {
  if (price <= 0 || rating <= 0) {
    return 0;
  }
  return (rating / price) * 10;
}

export function getValueLevel(valueScore: number): 'great' | 'fair' | 'avoid' {
  if (valueScore > 25) return 'great';
  if (valueScore >= 15) return 'fair';
  return 'avoid';
}

export function getValueBackgroundColor(valueScore: number): string {
  const level = getValueLevel(valueScore);
  switch (level) {
    case 'great':
      return 'bg-green-50';
    case 'fair':
      return 'bg-yellow-50';
    case 'avoid':
      return '';
  }
}

export function isValuePlay(valueScore: number): boolean {
  return valueScore > 25;
}
