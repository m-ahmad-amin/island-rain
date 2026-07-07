import {
  CURATED_WORDS,
  DEFAULT_DECOY_LETTERS,
  FLOOD_DELAY_SECONDS,
  FLOOD_RISE_SECONDS,
  HARD_CURATED_WORDS,
  type DailyPuzzle,
  ROUND_DURATION_SECONDS,
} from './puzzleConfig';
import { MAX_WORD_LENGTH } from './wordValidation';

/** Mulberry32 seeded PRNG */
export const createSeededRandom = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const hashDateToSeed = (date: string): number => {
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    hash = (Math.imul(31, hash) + date.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
};

export const getUtcDateString = (d = new Date()): string => {
  return d.toISOString().slice(0, 10);
};

export const shuffleWithSeed = <T>(items: T[], random: () => number): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j]!;
    copy[j] = tmp!;
  }
  return copy;
};

const lettersFromWords = (words: string[]): string[] => {
  const letters: string[] = [];
  for (const word of words) {
    for (const ch of word.toLowerCase()) {
      if (/[a-z]/.test(ch)) {
        letters.push(ch);
      }
    }
  }
  return letters;
};

const hasRepeatedLetters = (word: string): boolean => {
  const seen = new Set<string>();
  for (const ch of word.toLowerCase()) {
    if (seen.has(ch)) return true;
    seen.add(ch);
  }
  return false;
};

const buildHardWordPool = (): string[] => {
  const hardSet = new Set(
    HARD_CURATED_WORDS.map((w) => w.toLowerCase()).filter(
      (w) => w.length <= MAX_WORD_LENGTH
    )
  );
  const fromCurated = CURATED_WORDS.filter(
    (w) => w.length >= 6 && w.length <= MAX_WORD_LENGTH && hasRepeatedLetters(w)
  );
  for (const w of fromCurated) {
    hardSet.add(w.toLowerCase());
  }
  return [...hardSet];
};

const HARD_WORD_POOL = buildHardWordPool();

const FALLBACK_WORD_POOL = CURATED_WORDS.filter(
  (w) => w.length <= MAX_WORD_LENGTH
);

export const pickDecoyLetters = (
  answerWord: string,
  extraWords: string[],
  count: number,
  random: () => number
): string[] => {
  const answerSet = new Set(answerWord.toLowerCase().split(''));
  const pool = [
    ...DEFAULT_DECOY_LETTERS,
    ...lettersFromWords(extraWords),
  ].filter((ch) => !answerSet.has(ch));
  const unique = [...new Set(pool)];
  const shuffled = shuffleWithSeed(unique, random);
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(shuffled[i % shuffled.length] ?? 'x');
  }
  return result;
};

export const buildDailyPuzzle = (
  date: string,
  suggestedAnswerWord?: string | null
): DailyPuzzle => {
  const random = createSeededRandom(hashDateToSeed(date));
  let answerWord: string;

  const suggested = suggestedAnswerWord?.toLowerCase() ?? '';
  if (suggested && suggested.length <= MAX_WORD_LENGTH) {
    answerWord = suggested;
  } else {
    const pool =
      HARD_WORD_POOL.length > 0 ? HARD_WORD_POOL : FALLBACK_WORD_POOL;
    const wordIndex = Math.floor(random() * pool.length);
    answerWord = pool[wordIndex]!.toLowerCase();
  }

  const decoyCount = Math.max(14, Math.floor(random() * 8) + 14);
  const decoyLetters = pickDecoyLetters(answerWord, [], decoyCount, random);

  return {
    date,
    answerWord,
    decoyLetters,
    roundDurationSeconds: ROUND_DURATION_SECONDS,
    floodDelaySeconds: FLOOD_DELAY_SECONDS,
    floodRiseSeconds: FLOOD_RISE_SECONDS,
  };
};

const scrambleDifficulty = (original: string[], scrambled: string[]): number => {
  let score = 0;
  for (let i = 0; i < original.length; i++) {
    if (scrambled[i] !== original[i]) score += 2;
    else score -= 1;
  }
  const joined = scrambled.join('');
  if (joined === original.join('')) score -= 100;
  return score;
};

/** Scrambled fall order — pick the most confusing permutation for the date */
export const getScrambledAnswerLetters = (
  answerWord: string,
  date: string
): string[] => {
  const original = answerWord.toLowerCase().split('');
  let best: string[] | null = null;
  let bestScore = -Infinity;

  for (let attempt = 0; attempt < 32; attempt++) {
    const random = createSeededRandom(
      hashDateToSeed(`${date}-fall-${attempt}`)
    );
    const scrambled = shuffleWithSeed(original, random);
    if (scrambled.join('') === original.join('')) continue;

    const score = scrambleDifficulty(original, scrambled);
    if (score > bestScore) {
      bestScore = score;
      best = scrambled;
    }
  }

  if (best) return best;

  const fallbackRandom = createSeededRandom(hashDateToSeed(`${date}-fall-fallback`));
  return shuffleWithSeed(original, fallbackRandom);
};

const isLetterArray = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.every((item) => typeof item === 'string' && /^[a-z]$/i.test(item));

/** Validates Redis-cached puzzle data; returns null if missing or legacy schema */
export const normalizeDailyPuzzle = (
  raw: unknown,
  date: string
): DailyPuzzle | null => {
  if (!raw || typeof raw !== 'object') return null;

  const obj = raw as Record<string, unknown>;
  const answerWord =
    typeof obj.answerWord === 'string' ? obj.answerWord.trim().toLowerCase() : '';

  if (!/^[a-z]{3,12}$/.test(answerWord)) {
    return null;
  }

  let decoyLetters: string[] = DEFAULT_DECOY_LETTERS;
  if (isLetterArray(obj.decoyLetters)) {
    decoyLetters = obj.decoyLetters.map((ch) => ch.toLowerCase());
  }

  const floodDelaySeconds = FLOOD_DELAY_SECONDS;
  const floodRiseSeconds = FLOOD_RISE_SECONDS;
  const roundDurationSeconds = ROUND_DURATION_SECONDS;

  return {
    date: typeof obj.date === 'string' ? obj.date : date,
    answerWord,
    decoyLetters,
    roundDurationSeconds,
    floodDelaySeconds,
    floodRiseSeconds,
  };
};
