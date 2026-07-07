import type { DailyPuzzle } from './puzzleConfig';

export type LeaderboardEntry = {
  rank: number;
  timeMs: number | null;
  score: number | null;
  isYou: boolean;
};

export type UserStats = {
  streak: number;
  todayPlayed: boolean;
  todayWon: boolean;
  bestTimeMs: number | null;
  bestScore: number | null;
  spoiledToday: boolean;
  leaderboardEligible: boolean;
};

export type GameResultPayload = {
  won: boolean;
  timeMs: number;
  score: number;
  archive?: boolean;
};

export type GameResultResponse = {
  type: 'result';
  stats: UserStats;
  timeRank: number | null;
  scoreRank: number | null;
  countsForLeaderboard: boolean;
  timeEntries: LeaderboardEntry[];
  scoreEntries: LeaderboardEntry[];
};

export type RevealAnswerResponse = {
  type: 'reveal';
  spoiledToday: boolean;
  answerWord: string;
};

export type PuzzleResponse = {
  type: 'puzzle';
  puzzle: DailyPuzzle;
  stats: UserStats;
  puzzleDate: string;
  isArchive: boolean;
  isLiveChallenge: boolean;
  canShare: boolean;
};

export type LeaderboardResponse = {
  type: 'leaderboard';
  date: string;
  timeEntries: LeaderboardEntry[];
  scoreEntries: LeaderboardEntry[];
};

export type ArchiveDatesResponse = {
  type: 'archive-dates';
  dates: string[];
};

export type DecoySubmitPayload = {
  word: string;
};

export type DecoySubmitResponse = {
  type: 'decoy';
  accepted: boolean;
  message: string;
};

export type ShareResultPayload = {
  won: boolean;
  timeMs: number;
  score: number;
  date?: string;
};

export type ShareResultResponse = {
  type: 'share';
  ok: true;
};

export type InitResponse = {
  type: 'init';
  postId: string;
  username: string;
};

export type ErrorResponse = {
  status: 'error';
  message: string;
};

export type GameEndEvent = {
  won: boolean;
  timeMs: number;
  score: number;
  answerWord: string;
};
