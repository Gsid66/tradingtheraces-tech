import { Scratching } from '@/lib/hooks/useScratchings';

/**
 * Check if a horse is scratched
 */
export function isHorseScratched(
  horseName: string,
  trackName: string,
  raceNumber: number,
  scratchings: Scratching[]
): boolean {
  return scratchings.some(
    (s) =>
      s.horseName.toLowerCase() === horseName.toLowerCase() &&
      s.trackName.toLowerCase() === trackName.toLowerCase() &&
      s.raceNumber === raceNumber
  );
}

/**
 * Get scratching details for a horse
 */
export function getScratchingDetails(
  horseName: string,
  trackName: string,
  raceNumber: number,
  scratchings: Scratching[]
): Scratching | undefined {
  return scratchings.find(
    (s) =>
      s.horseName.toLowerCase() === horseName.toLowerCase() &&
      s.trackName.toLowerCase() === trackName.toLowerCase() &&
      s.raceNumber === raceNumber
  );
}

/**
 * Filter out scratched horses from a race
 */
export function filterScratched<T extends { horse_name: string }>(
  horses: T[],
  trackName: string,
  raceNumber: number,
  scratchings: Scratching[]
): T[] {
  return horses.filter(
    (horse) => !isHorseScratched(horse.horse_name, trackName, raceNumber, scratchings)
  );
}

/**
 * Count scratchings for a specific race
 */
export function countScratchingsForRace(
  trackName: string,
  raceNumber: number,
  scratchings: Scratching[]
): number {
  return scratchings.filter(
    (s) =>
      s.trackName.toLowerCase() === trackName.toLowerCase() &&
      s.raceNumber === raceNumber
  ).length;
}
