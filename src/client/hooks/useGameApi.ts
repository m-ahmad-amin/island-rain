import { useCallback, useEffect, useState } from 'react';
import type { DailyPuzzle } from '../../shared/puzzleConfig';
import { normalizeDailyPuzzle } from '../../shared/puzzle';
import type {
  PuzzleResponse,
  GameResultPayload,
  GameResultResponse,
  LeaderboardResponse,
  ArchiveDatesResponse,
  DecoySubmitPayload,
  DecoySubmitResponse,
  RevealAnswerResponse,
  ShareResultPayload,
  ShareResultResponse,
  UserStats,
  LeaderboardEntry,
  ErrorResponse,
} from '../../shared/api';

type GameApiState = {
  puzzle: DailyPuzzle | null;
  puzzleDate: string;
  isArchive: boolean;
  isLiveChallenge: boolean;
  canShare: boolean;
  stats: UserStats | null;
  timeLeaderboard: LeaderboardEntry[];
  scoreLeaderboard: LeaderboardEntry[];
  archiveDates: string[];
  loading: boolean;
  error: string | null;
};

const fetchPuzzle = async (date?: string): Promise<PuzzleResponse> => {
  const url = date ? `/api/puzzle?date=${encodeURIComponent(date)}` : '/api/puzzle';
  const res = await fetch(url);
  if (!res.ok) {
    const err: ErrorResponse = await res.json();
    throw new Error(err.message);
  }
  return res.json() as Promise<PuzzleResponse>;
};

const fetchLeaderboard = async (date: string): Promise<LeaderboardResponse | null> => {
  const res = await fetch(`/api/leaderboard?date=${encodeURIComponent(date)}`);
  if (!res.ok) return null;
  return res.json() as Promise<LeaderboardResponse>;
};

export const useGameApi = () => {
  const [state, setState] = useState<GameApiState>({
    puzzle: null,
    puzzleDate: '',
    isArchive: false,
    isLiveChallenge: true,
    canShare: false,
    stats: null,
    timeLeaderboard: [],
    scoreLeaderboard: [],
    archiveDates: [],
    loading: true,
    error: null,
  });

  const applyPuzzleResponse = useCallback(
    async (puzzleData: PuzzleResponse) => {
      const puzzle = normalizeDailyPuzzle(puzzleData.puzzle, puzzleData.puzzle.date);
      if (!puzzle) {
        throw new Error('Invalid puzzle data from server');
      }

      let timeLeaderboard: LeaderboardEntry[] = [];
      let scoreLeaderboard: LeaderboardEntry[] = [];

      const lb = await fetchLeaderboard(puzzleData.puzzleDate);
      if (lb) {
        timeLeaderboard = lb.timeEntries;
        scoreLeaderboard = lb.scoreEntries;
      }

      setState((prev) => ({
        ...prev,
        puzzle,
        puzzleDate: puzzleData.puzzleDate,
        isArchive: puzzleData.isArchive,
        isLiveChallenge: puzzleData.isLiveChallenge,
        canShare: puzzleData.canShare,
        stats: puzzleData.stats,
        timeLeaderboard,
        scoreLeaderboard,
        loading: false,
        error: null,
      }));
    },
    []
  );

  useEffect(() => {
    const load = async () => {
      try {
        const [puzzleData, archiveRes] = await Promise.all([
          fetchPuzzle(),
          fetch('/api/archive-dates'),
        ]);

        let archiveDates: string[] = [];
        if (archiveRes.ok) {
          const archiveData: ArchiveDatesResponse = await archiveRes.json();
          archiveDates = archiveData.dates;
        }

        await applyPuzzleResponse(puzzleData);
        setState((prev) => ({ ...prev, archiveDates }));
      } catch (err) {
        console.error('Failed to load game data', err);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load',
        }));
      }
    };
    void load();
  }, [applyPuzzleResponse]);

  const loadArchivePuzzle = useCallback(
    async (date: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const puzzleData = await fetchPuzzle(date);
        await applyPuzzleResponse(puzzleData);
      } catch (err) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load archive',
        }));
      }
    },
    [applyPuzzleResponse]
  );

  const loadLivePuzzle = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const puzzleData = await fetchPuzzle();
      await applyPuzzleResponse(puzzleData);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load puzzle',
      }));
    }
  }, [applyPuzzleResponse]);

  const submitResult = useCallback(
    async (payload: GameResultPayload): Promise<GameResultResponse | null> => {
      const puzzleDate = state.puzzleDate;
      try {
        const res = await fetch('/api/result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            date: puzzleDate || undefined,
          }),
        });
        if (!res.ok) return null;
        const data: GameResultResponse = await res.json();

        setState((prev) => ({
          ...prev,
          stats: data.stats,
          timeLeaderboard: data.timeEntries,
          scoreLeaderboard: data.scoreEntries,
        }));

        return data;
      } catch (err) {
        console.error('Failed to submit result', err);
        return null;
      }
    },
    [state.puzzleDate]
  );

  const revealAnswer = useCallback(
    async (): Promise<RevealAnswerResponse | null> => {
      try {
        const res = await fetch('/api/reveal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: state.puzzleDate || undefined }),
        });
        if (!res.ok) return null;
        const data: RevealAnswerResponse = await res.json();

        setState((prev) => ({
          ...prev,
          stats: prev.stats
            ? {
                ...prev.stats,
                spoiledToday: true,
                leaderboardEligible: false,
              }
            : prev.stats,
        }));

        return data;
      } catch (err) {
        console.error('Failed to reveal answer', err);
        return null;
      }
    },
    [state.puzzleDate]
  );

  const submitWordSuggestion = useCallback(
    async (word: string): Promise<DecoySubmitResponse | null> => {
      try {
        const payload: DecoySubmitPayload = { word };
        const res = await fetch('/api/decoy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) return null;
        return (await res.json()) as DecoySubmitResponse;
      } catch (err) {
        console.error('Failed to submit word suggestion', err);
        return null;
      }
    },
    []
  );

  const shareResult = useCallback(
    async (
      payload: ShareResultPayload
    ): Promise<{ ok: true } | { ok: false; message: string }> => {
      try {
        const res = await fetch('/api/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            date: state.puzzleDate || undefined,
          }),
        });
        if (!res.ok) {
          const err: ErrorResponse = await res.json();
          return { ok: false, message: err.message };
        }
        await res.json() as ShareResultResponse;
        return { ok: true };
      } catch (err) {
        console.error('Failed to share result', err);
        return { ok: false, message: 'Could not share — try again' };
      }
    },
    [state.puzzleDate]
  );

  return {
    ...state,
    loadArchivePuzzle,
    loadLivePuzzle,
    submitResult,
    revealAnswer,
    submitWordSuggestion,
    shareResult,
  };
};

export const formatTime = (timeMs: number): string => {
  const totalSec = Math.floor(timeMs / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  const ms = Math.floor((timeMs % 1000) / 10);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};
