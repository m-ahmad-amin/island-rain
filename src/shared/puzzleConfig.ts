/** Difficulty knobs — tune after playtesting */
export const FLOOD_DELAY_SECONDS = 180;
export const FLOOD_RISE_SECONDS = 120;
export const ROUND_DURATION_SECONDS = FLOOD_DELAY_SECONDS + FLOOD_RISE_SECONDS;
export const LEADERBOARD_TOP = 5;
export const LETTER_SPAWN_INTERVAL_MS = 1400;
export const DECOY_SPAWN_INTERVAL_MS = 700;
export const MAX_FALLING_LETTERS = 4;
export const MAX_FALLING_DECOYS = 7;
export const LETTER_GROUND_LINGER_SECONDS = 5;
export const RAIN_DROP_COUNT = 240;
export const STARTING_SCORE = 0;
export const COLLECT_LETTER_BONUS = 15;
export const DECOY_SCORE_PENALTY = 10;
export const DECOY_TIME_PENALTY_SECONDS = 5;
export const LETTER_BRIEFING_SECONDS = 5;
export const ESCAPE_BONUS = 500;
export const MAX_TIME_BONUS = 500;

/** Past puzzles available from this UTC date (inclusive) */
export const ARCHIVE_START_DATE = '2026-07-01';

/** Bump when DailyPuzzle shape changes so stale Redis entries are ignored */
export const PUZZLE_CACHE_VERSION = 6;

export type DailyPuzzle = {
  date: string;
  answerWord: string;
  decoyLetters: string[];
  roundDurationSeconds: number;
  floodDelaySeconds: number;
  floodRiseSeconds: number;
};

/** Well-known, family-friendly words — island / nature / everyday */
export const CURATED_WORDS: string[] = [
  'ocean',
  'beach',
  'island',
  'river',
  'cloud',
  'rain',
  'storm',
  'breeze',
  'sunset',
  'sunrise',
  'summer',
  'winter',
  'spring',
  'garden',
  'flower',
  'forest',
  'meadow',
  'planet',
  'rocket',
  'castle',
  'dragon',
  'friend',
  'family',
  'happy',
  'music',
  'purple',
  'yellow',
  'orange',
  'silver',
  'golden',
  'market',
  'pencil',
  'school',
  'planet',
  'rescue',
  'anchor',
  'harbor',
  'signal',
  'compass',
  'treasure',
  'voyage',
  'paddle',
  'coconut',
  'dolphin',
  'turtle',
  'parrot',
  'candle',
  'bridge',
  'village',
  'kitchen',
  'window',
  'blanket',
  'picture',
  'bicycle',
  'chicken',
  'penguin',
  'cookies',
  'rainbow',
  'balloon',
  'pocket',
  'blanket',
  'morning',
  'evening',
  'holiday',
  'journey',
  'welcome',
  'freedom',
  'courage',
  'balance',
  'harmony',
  'miracle',
  'natural',
  'healthy',
  'helpful',
  'honesty',
  'library',
  'history',
  'science',
  'teacher',
  'student',
  'village',
  'weather',
  'wildlife',
  'wonder',
  'younger',
];

/** Words with repeated letters / tricky unscramble — preferred for daily puzzles */
export const HARD_CURATED_WORDS: string[] = [
  'letter',
  'better',
  'butter',
  'little',
  'middle',
  'puzzle',
  'bubble',
  'rabbit',
  'summer',
  'hammer',
  'dinner',
  'pepper',
  'matter',
  'coconut',
  'compass',
  'blanket',
  'balance',
  'harmony',
  'journey',
  'morning',
  'evening',
  'library',
  'science',
  'teacher',
  'weather',
  'wildlife',
  'natural',
  'courage',
  'holiday',
  'kitchen',
  'picture',
  'balloon',
  'cookies',
  'rainbow',
  'village',
  'treasure',
  'dolphin',
  'penguin',
  'harbor',
  'paddle',
  'bicycle',
  'chicken',
  'blanket',
  'freedom',
  'healthy',
  'helpful',
  'honesty',
  'history',
  'student',
  'welcome',
  'miracle',
];

/** Default decoy letters when no UGC exists */
export const DEFAULT_DECOY_LETTERS: string[] = [
  'x', 'z', 'q', 'j', 'k', 'v', 'w', 'f', 'h', 'm',
  'p', 'g', 'b', 'y', 'u', 'r', 'e', 'o', 'n', 't',
  's', 'l', 'c', 'd', 'a', 'i',
];
