import { Hono } from 'hono';
import { context, reddit } from '@devvit/web/server';
import { buildShareComment } from '../core/shareResult';
import { getArchiveDates } from '../../shared/archive';
import type {
  PuzzleResponse,
  GameResultResponse,
  LeaderboardResponse,
  ArchiveDatesResponse,
  DecoySubmitResponse,
  RevealAnswerResponse,
  ShareResultResponse,
  ErrorResponse,
} from '../../shared/api';
import {
  getOrCreateDailyPuzzle,
  getUserStats,
  saveGameResult,
  getLeaderboards,
  submitWordSuggestion,
  markSpoiledToday,
  isSpoiledToday,
} from '../core/puzzleService';
import {
  isLiveChallengeDate,
  resolvePuzzleDate,
  canSharePuzzleDate,
} from '../core/puzzleDate';
export const api = new Hono();

const getUserId = async (): Promise<string> => {
  const username = (await reddit.getCurrentUsername()) ?? 'anonymous';
  return context.userId ?? username;
};

api.get('/puzzle', async (c) => {
  try {
    const requestedDate = c.req.query('date');
    const puzzleDate = resolvePuzzleDate(requestedDate);
    const userId = await getUserId();
    const puzzle = await getOrCreateDailyPuzzle(puzzleDate);
    const stats = await getUserStats(userId, puzzleDate);
    const isArchive = !isLiveChallengeDate(puzzleDate);

    return c.json<PuzzleResponse>({
      type: 'puzzle',
      puzzle,
      stats,
      puzzleDate,
      isArchive,
      isLiveChallenge: !isArchive,
      canShare: canSharePuzzleDate(puzzleDate),
    });
  } catch (error) {
    console.error('API puzzle error:', error);
    return c.json<ErrorResponse>(
      { status: 'error', message: 'Failed to load puzzle' },
      500
    );
  }
});

api.get('/archive-dates', (c) => {
  return c.json<ArchiveDatesResponse>({
    type: 'archive-dates',
    dates: getArchiveDates(),
  });
});

api.get('/leaderboard', async (c) => {
  try {
    const requestedDate = c.req.query('date');
    const date = resolvePuzzleDate(requestedDate);
    const userId = await getUserId();
    const { timeEntries, scoreEntries } = await getLeaderboards(date, userId);

    return c.json<LeaderboardResponse>({
      type: 'leaderboard',
      date,
      timeEntries,
      scoreEntries,
    });
  } catch (error) {
    console.error('API leaderboard error:', error);
    return c.json<ErrorResponse>(
      { status: 'error', message: 'Failed to load leaderboard' },
      500
    );
  }
});

api.post('/result', async (c) => {
  try {
    const body = await c.req.json<{
      won: boolean;
      timeMs: number;
      score: number;
      archive?: boolean;
      date?: string;
    }>();

    const puzzleDate = resolvePuzzleDate(body.date ?? null);
    const userId = await getUserId();
    const spoiled = await isSpoiledToday(userId, puzzleDate);
    const countsForLeaderboard =
      !body.archive &&
      isLiveChallengeDate(puzzleDate) &&
      body.won &&
      !spoiled;

    const { stats, timeRank, scoreRank, timeEntries, scoreEntries } =
      await saveGameResult(
        userId,
        puzzleDate,
        body.won,
        body.timeMs,
        body.score,
        countsForLeaderboard
      );

    return c.json<GameResultResponse>({
      type: 'result',
      stats,
      timeRank,
      scoreRank,
      countsForLeaderboard,
      timeEntries,
      scoreEntries,
    });
  } catch (error) {
    console.error('API result error:', error);
    return c.json<ErrorResponse>(
      { status: 'error', message: 'Failed to save result' },
      500
    );
  }
});

api.post('/reveal', async (c) => {
  try {
    const body = await c.req.json<{ date?: string }>();
    const puzzleDate = resolvePuzzleDate(body.date ?? null);
    const userId = await getUserId();

    if (!isLiveChallengeDate(puzzleDate)) {
      return c.json<ErrorResponse>(
        { status: 'error', message: 'Reveal is only for today\'s puzzle' },
        400
      );
    }

    await markSpoiledToday(userId, puzzleDate);
    const puzzle = await getOrCreateDailyPuzzle(puzzleDate);

    return c.json<RevealAnswerResponse>({
      type: 'reveal',
      spoiledToday: true,
      answerWord: puzzle.answerWord,
    });
  } catch (error) {
    console.error('API reveal error:', error);
    return c.json<ErrorResponse>(
      { status: 'error', message: 'Failed to reveal answer' },
      500
    );
  }
});

api.post('/share', async (c) => {
  try {
    const body = await c.req.json<{
      won: boolean;
      timeMs: number;
      score: number;
      date?: string;
    }>();

    if (!body.won) {
      return c.json<ErrorResponse>(
        { status: 'error', message: 'Only escapes can be shared' },
        400
      );
    }

    const postId = context.postId;
    if (!postId) {
      return c.json<ErrorResponse>(
        { status: 'error', message: 'Open from a puzzle post to share' },
        400
      );
    }

    const puzzleDate = resolvePuzzleDate(body.date ?? null);
    if (!canSharePuzzleDate(puzzleDate)) {
      return c.json<ErrorResponse>(
        {
          status: 'error',
          message: 'Open that day\'s post to share this result',
        },
        400
      );
    }

    const isArchive = !isLiveChallengeDate(puzzleDate);
    const text = buildShareComment(body.timeMs, body.score, puzzleDate, isArchive);

    await reddit.submitComment({
      id: postId,
      text,
      runAs: 'USER',
    });

    return c.json<ShareResultResponse>({ type: 'share', ok: true });
  } catch (error) {
    console.error('API share error:', error);
    return c.json<ErrorResponse>(
      { status: 'error', message: 'Could not post comment' },
      500
    );
  }
});

api.post('/decoy', async (c) => {
  try {
    const body = await c.req.json<{ word: string }>();
    const { accepted, message } = await submitWordSuggestion(body.word);

    return c.json<DecoySubmitResponse>({
      type: 'decoy',
      accepted,
      message,
    });
  } catch (error) {
    console.error('API word suggestion error:', error);
    return c.json<ErrorResponse>(
      { status: 'error', message: 'Failed to submit word' },
      500
    );
  }
});
