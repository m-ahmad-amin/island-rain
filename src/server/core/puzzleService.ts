import { redis } from '@devvit/web/server';
import {
  buildDailyPuzzle,
  getUtcDateString,
  normalizeDailyPuzzle,
} from '../../shared/puzzle';
import type { DailyPuzzle } from '../../shared/puzzleConfig';
import {
  LEADERBOARD_TOP,
  PUZZLE_CACHE_VERSION,
} from '../../shared/puzzleConfig';
import type { LeaderboardEntry, UserStats } from '../../shared/api';
import {
  isValidPuzzleWord,
  normalizeWord,
  wordValidationMessage,
} from '../../shared/wordValidation';

const puzzleKey = (date: string): string => `puzzle:v${PUZZLE_CACHE_VERSION}:${date}`;
const wordQueueKey = (): string => 'word-suggestion-queue';
const userResultKey = (userId: string, date: string): string =>
  `result:${userId}:${date}`;
const userStreakKey = (userId: string): string => `streak:${userId}`;
const userSpoiledKey = (userId: string, date: string): string =>
  `spoiled:${userId}:${date}`;
const timeLeaderboardKey = (date: string): string => `lb:time:${date}`;
const scoreLeaderboardKey = (date: string): string => `lb:score:${date}`;

const getWordQueue = async (): Promise<string[]> => {
  const raw = await redis.get(wordQueueKey());
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((w): w is string => typeof w === 'string');
    }
  } catch {
    return [];
  }
  return [];
};

/** Take the first valid queued word for a new daily puzzle */
const consumeSuggestedWord = async (): Promise<string | null> => {
  const queue = await getWordQueue();
  if (queue.length === 0) return null;

  const remaining: string[] = [];
  let picked: string | null = null;

  for (const word of queue) {
    const cleaned = normalizeWord(word);
    if (!picked && isValidPuzzleWord(cleaned)) {
      picked = cleaned;
    } else {
      remaining.push(cleaned);
    }
  }

  await redis.set(wordQueueKey(), JSON.stringify(remaining.slice(0, 200)));
  return picked;
};

export const isSpoiledToday = async (
  userId: string,
  date: string
): Promise<boolean> => {
  const raw = await redis.get(userSpoiledKey(userId, date));
  return raw === '1';
};

export const markSpoiledToday = async (
  userId: string,
  date: string
): Promise<void> => {
  await redis.set(userSpoiledKey(userId, date), '1');
};

export const getOrCreateDailyPuzzle = async (date: string): Promise<DailyPuzzle> => {
  const cached = await redis.get(puzzleKey(date));
  if (cached) {
    const normalized = normalizeDailyPuzzle(JSON.parse(cached), date);
    if (normalized) {
      return normalized;
    }
  }

  const suggestedWord = await consumeSuggestedWord();
  const puzzle = buildDailyPuzzle(date, suggestedWord);
  await redis.set(puzzleKey(date), JSON.stringify(puzzle));
  return puzzle;
};

export const getUserStats = async (
  userId: string,
  date: string
): Promise<UserStats> => {
  const [streakRaw, resultRaw, spoiledToday] = await Promise.all([
    redis.get(userStreakKey(userId)),
    redis.get(userResultKey(userId, date)),
    isSpoiledToday(userId, date),
  ]);

  const streak = streakRaw ? parseInt(streakRaw, 10) : 0;
  let todayPlayed = false;
  let todayWon = false;
  let bestTimeMs: number | null = null;
  let bestScore: number | null = null;

  if (resultRaw) {
    const result = JSON.parse(resultRaw) as {
      won: boolean;
      timeMs: number;
      score: number;
    };
    todayPlayed = true;
    todayWon = result.won;
    if (result.won) {
      bestTimeMs = result.timeMs;
      bestScore = result.score;
    }
  }

  return {
    streak,
    todayPlayed,
    todayWon,
    bestTimeMs,
    bestScore,
    spoiledToday,
    leaderboardEligible: !spoiledToday,
  };
};

const buildLeaderboardEntries = async (
  key: string,
  userId: string,
  mode: 'time' | 'score'
): Promise<LeaderboardEntry[]> => {
  // By rank (not by score) — start/stop are indices, not score values
  const rows =
    mode === 'time'
      ? await redis.zRange(key, 0, -1)
      : await redis.zRange(key, 0, -1, { by: 'rank', reverse: true });

  return rows
    .filter((row) => !row.member.startsWith('demo:'))
    .slice(0, LEADERBOARD_TOP)
    .map((row, i) => ({
      rank: i + 1,
      timeMs: mode === 'time' ? row.score : null,
      score: mode === 'score' ? row.score : null,
      isYou: row.member === userId,
    }));
};

export const saveGameResult = async (
  userId: string,
  date: string,
  won: boolean,
  timeMs: number,
  score: number,
  countsForLeaderboard: boolean
): Promise<{
  stats: UserStats;
  timeRank: number | null;
  scoreRank: number | null;
  timeEntries: LeaderboardEntry[];
  scoreEntries: LeaderboardEntry[];
}> => {
  const existingRaw = await redis.get(userResultKey(userId, date));
  let bestTimeMs: number | null = null;
  let bestScore: number | null = null;
  let finalWon = won;

  if (existingRaw) {
    const existing = JSON.parse(existingRaw) as {
      won: boolean;
      timeMs: number;
      score: number;
    };
    finalWon = existing.won || won;

    if (existing.won) {
      bestTimeMs = existing.timeMs;
      bestScore = existing.score;
    }

    if (won) {
      if (!existing.won || timeMs < (existing.timeMs ?? Infinity)) {
        bestTimeMs = timeMs;
      }
      if (!existing.won || score > (existing.score ?? -1)) {
        bestScore = score;
      }
    }
  } else if (won) {
    bestTimeMs = timeMs;
    bestScore = score;
  }

  const storedTime = bestTimeMs ?? timeMs;
  const storedScore = bestScore ?? score;

  await redis.set(
    userResultKey(userId, date),
    JSON.stringify({
      won: finalWon,
      timeMs: finalWon ? storedTime : timeMs,
      score: finalWon ? storedScore : score,
    })
  );

  const streakRaw = await redis.get(userStreakKey(userId));
  let streak = streakRaw ? parseInt(streakRaw, 10) : 0;

  if (countsForLeaderboard && won) {
    if (!existingRaw) {
      streak += 1;
    } else {
      const existing = JSON.parse(existingRaw) as { won: boolean };
      if (!existing.won) {
        streak += 1;
      }
    }
    await redis.set(userStreakKey(userId), String(streak));

    const existingTime = await redis.zScore(timeLeaderboardKey(date), userId);
    if (existingTime === undefined || timeMs < existingTime) {
      await redis.zAdd(timeLeaderboardKey(date), { member: userId, score: timeMs });
    }

    const existingScore = await redis.zScore(scoreLeaderboardKey(date), userId);
    if (existingScore === undefined || score > existingScore) {
      await redis.zAdd(scoreLeaderboardKey(date), { member: userId, score });
    }
  } else if (countsForLeaderboard && !existingRaw && !won) {
    await redis.set(userStreakKey(userId), '0');
    streak = 0;
  }

  let timeRank: number | null = null;
  let scoreRank: number | null = null;

  if (countsForLeaderboard && won) {
    const tr = await redis.zRank(timeLeaderboardKey(date), userId);
    timeRank = tr !== undefined ? tr + 1 : null;

    const scoreRows = await redis.zRange(scoreLeaderboardKey(date), 0, -1, {
      by: 'rank',
      reverse: true,
    });
    const scoreIdx = scoreRows.findIndex((row) => row.member === userId);
    scoreRank = scoreIdx >= 0 ? scoreIdx + 1 : null;
  }

  const spoiledToday = await isSpoiledToday(userId, date);
  const { timeEntries, scoreEntries } = await getLeaderboards(date, userId);

  return {
    stats: {
      streak,
      todayPlayed: true,
      todayWon: finalWon,
      bestTimeMs: finalWon ? bestTimeMs : null,
      bestScore: finalWon ? bestScore : null,
      spoiledToday,
      leaderboardEligible: !spoiledToday,
    },
    timeRank,
    scoreRank,
    timeEntries,
    scoreEntries,
  };
};

export const getLeaderboards = async (
  date: string,
  userId: string
): Promise<{ timeEntries: LeaderboardEntry[]; scoreEntries: LeaderboardEntry[] }> => {
  const [timeEntries, scoreEntries] = await Promise.all([
    buildLeaderboardEntries(timeLeaderboardKey(date), userId, 'time'),
    buildLeaderboardEntries(scoreLeaderboardKey(date), userId, 'score'),
  ]);

  return { timeEntries, scoreEntries };
};

export const submitWordSuggestion = async (word: string): Promise<{
  accepted: boolean;
  message: string;
}> => {
  const cleaned = normalizeWord(word);
  const validationError = wordValidationMessage(cleaned);
  if (validationError) {
    return { accepted: false, message: validationError };
  }

  const queue = await getWordQueue();
  if (queue.includes(cleaned)) {
    return { accepted: false, message: 'That word is already in the queue' };
  }

  queue.push(cleaned);
  await redis.set(wordQueueKey(), JSON.stringify(queue.slice(-200)));
  return {
    accepted: true,
    message: 'Word queued for a future daily puzzle',
  };
};

export { getUtcDateString };
