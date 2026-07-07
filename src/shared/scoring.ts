import { ESCAPE_BONUS, FLOOD_DELAY_SECONDS, MAX_TIME_BONUS } from './puzzleConfig';

/** Final score on escape: penalties + escape bonus + early-finish bonus */
export const calculateWinScore = (
  runningScore: number,
  elapsedSec: number
): number => {
  const timeBonus = Math.max(
    0,
    Math.round(
      ((FLOOD_DELAY_SECONDS - elapsedSec) / FLOOD_DELAY_SECONDS) *
        MAX_TIME_BONUS
    )
  );
  return runningScore + ESCAPE_BONUS + timeBonus;
};
