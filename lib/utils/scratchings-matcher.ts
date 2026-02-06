import { horseNamesMatch } from './horse-name-matcher';

export interface Scratching {
  meetingId: string;
  raceId: string;
  raceNumber: number;
  horseName: string;
  tabNumber: number;
  scratchingTime: string;
  reason?: string;
}

export function isHorseScratched(
  scratchings: Scratching[],
  meetingId: string,
  raceNumber: number,
  horseName: string
): boolean {
  return scratchings.some(
    s =>
      s.meetingId === meetingId &&
      s.raceNumber === raceNumber &&
      horseNamesMatch(s.horseName, horseName)
  );
}

export function getScratchingInfo(
  scratchings: Scratching[],
  meetingId: string,
  raceNumber: number,
  horseName: string
): Scratching | undefined {
  return scratchings.find(
    s =>
      s.meetingId === meetingId &&
      s.raceNumber === raceNumber &&
      horseNamesMatch(s.horseName, horseName)
  );
}

export function getScratchingsForRace(
  scratchings: Scratching[],
  meetingId: string,
  raceNumber: number
): Scratching[] {
  return scratchings.filter(
    s => s.meetingId === meetingId && s.raceNumber === raceNumber
  );
}
