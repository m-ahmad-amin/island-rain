import { useState } from 'react';
import { showToast } from '@devvit/web/client';
import { formatArchiveLabel } from '../../shared/archive';
import type { DailyPuzzle } from '../../shared/puzzleConfig';
import { MIN_WORD_LENGTH, MAX_WORD_LENGTH } from '../../shared/wordValidation';
import type { LeaderboardEntry, UserStats } from '../../shared/api';
import { formatTime } from '../hooks/useGameApi';

type ResultScreenProps = {
  won: boolean;
  timeMs: number;
  finalScore: number;
  puzzle: DailyPuzzle;
  stats: UserStats | null;
  timeLeaderboard: LeaderboardEntry[];
  scoreLeaderboard: LeaderboardEntry[];
  timeRank: number | null;
  scoreRank: number | null;
  countsForLeaderboard: boolean;
  isLiveChallenge: boolean;
  isArchive: boolean;
  puzzleDate: string;
  canShare: boolean;
  onPlayAgain: () => void;
  onSubmitWord: (word: string) => Promise<{ accepted: boolean; message: string }>;
  onRevealAnswer: () => Promise<string | null>;
  onSharePuzzle: () => Promise<{ ok: true } | { ok: false; message: string }>;
  onOpenArchive?: () => void;
  onBackToToday?: () => void;
};

type LeaderboardMode = 'time' | 'score';

const LeaderboardPanel = ({
  timeLeaderboard,
  scoreLeaderboard,
}: {
  timeLeaderboard: LeaderboardEntry[];
  scoreLeaderboard: LeaderboardEntry[];
}) => {
  const [mode, setMode] = useState<LeaderboardMode>('time');

  const entries = mode === 'time' ? timeLeaderboard : scoreLeaderboard;
  const valueKey = mode === 'time' ? 'timeMs' : 'score';

  return (
    <div className="result-lb">
      <div className="result-lb__toggle" role="tablist" aria-label="Leaderboard type">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'time'}
          className={`result-lb__toggle-btn${mode === 'time' ? ' result-lb__toggle-btn--active' : ''}`}
          onClick={() => setMode('time')}
        >
          Fastest
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'score'}
          className={`result-lb__toggle-btn${mode === 'score' ? ' result-lb__toggle-btn--active' : ''}`}
          onClick={() => setMode('score')}
        >
          Scores
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="result-lb__empty">No players yet</p>
      ) : (
        <ol className="result-lb__list">
          {entries.map((entry) => (
            <li
              key={`${mode}-${entry.rank}`}
              className={`result-lb__row${entry.isYou ? ' result-lb__row--you' : ''}`}
            >
              <span className="result-lb__rank">{entry.rank}</span>
              <span className="result-lb__value">
                {valueKey === 'timeMs' && entry.timeMs !== null
                  ? formatTime(entry.timeMs)
                  : entry.score ?? 0}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};

export const ResultScreen = ({
  won,
  timeMs,
  finalScore,
  puzzle,
  stats,
  timeLeaderboard,
  scoreLeaderboard,
  timeRank,
  scoreRank,
  countsForLeaderboard,
  isLiveChallenge,
  isArchive,
  puzzleDate,
  canShare,
  onPlayAgain,
  onSubmitWord,
  onRevealAnswer,
  onSharePuzzle,
  onOpenArchive,
  onBackToToday,
}: ResultScreenProps) => {
  const [suggestedWord, setSuggestedWord] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [wordSubmitted, setWordSubmitted] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const [revealedWord, setRevealedWord] = useState<string | null>(
    stats?.spoiledToday ? puzzle.answerWord : null
  );
  const [revealing, setRevealing] = useState(false);

  const spoiled = stats?.spoiledToday ?? revealedWord !== null;

  const handleShare = async () => {
    setSharing(true);
    const result = await onSharePuzzle();
    setSharing(false);

    if (result.ok) {
      setShared(true);
      showToast('Posted to comments');
    } else {
      showToast(result.message);
    }
  };

  const resultEyebrow = isArchive
    ? formatArchiveLabel(puzzleDate)
    : 'Today';

  const handleWordSubmit = async () => {
    const trimmed = suggestedWord.trim().toLowerCase();
    if (!trimmed || trimmed.includes(' ')) {
      showToast('One word only');
      return;
    }

    setSubmitting(true);
    const result = await onSubmitWord(trimmed);
    setSubmitting(false);

    if (result.accepted) {
      setWordSubmitted(true);
      showToast('Queued for a future day');
    } else {
      showToast(result.message);
    }
  };

  const handleReveal = async () => {
    setRevealing(true);
    const word = await onRevealAnswer();
    setRevealing(false);

    if (word) {
      setRevealedWord(word);
      showToast('Retries won\'t count on the board');
    } else {
      showToast('Could not reveal');
    }
  };

  return (
    <div className="result-screen">
      <div className={`result-card${won ? ' result-card--won' : ' result-card--lost'}`}>
        <header className="result-card__header">
          <p className="result-card__eyebrow">
            {resultEyebrow}
            {won ? ' · Escape' : ' · Flooded'}
          </p>
          <h1 className="result-card__title">{won ? 'Escaped' : 'Sunk'}</h1>

          {won ? (
            <div className="result-card__stats">
              <div>
                <span className="result-card__stat-label">Time</span>
                <span className="result-card__stat-value">{formatTime(timeMs)}</span>
              </div>
              <div className="result-card__stat-divider" />
              <div>
                <span className="result-card__stat-label">Score</span>
                <span className="result-card__stat-value">{finalScore}</span>
              </div>
              {(timeRank !== null || scoreRank !== null) && (
                <>
                  <div className="result-card__stat-divider" />
                  <div>
                    <span className="result-card__stat-label">Rank</span>
                    <span className="result-card__stat-value">
                      {timeRank !== null ? `#${timeRank}` : '—'}
                      {scoreRank !== null ? ` / #${scoreRank}` : ''}
                    </span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="result-card__lost-body">
              {revealedWord ? (
                <p className="result-card__answer">
                  Word was <strong>{revealedWord.toUpperCase()}</strong>
                </p>
              ) : (
                <p className="result-card__hint">
                  Retry without revealing to stay on the leaderboard.
                </p>
              )}
            </div>
          )}

          {!countsForLeaderboard && isLiveChallenge && spoiled && won && (
            <p className="result-card__note">Past Puzzle | not on leaderboard</p>
          )}
        </header>

        {stats && isLiveChallenge && (stats.streak > 0 || stats.bestTimeMs !== null) && (
          <div className="result-meta">
            {stats.streak > 0 && <span>Streak {stats.streak}</span>}
            {stats.bestTimeMs !== null && (
              <span>Best {formatTime(stats.bestTimeMs)}</span>
            )}
            {stats.bestScore !== null && <span>Best score {stats.bestScore}</span>}
          </div>
        )}

        <div className="result-boards">
          {isArchive && (
            <p className="result-card__hint">
              Past puzzle.
            </p>
          )}
          <LeaderboardPanel
            timeLeaderboard={timeLeaderboard}
            scoreLeaderboard={scoreLeaderboard}
          />
        </div>

        {!won && isLiveChallenge && !revealedWord && (
          <button
            type="button"
            className="result-btn result-btn--ghost"
            onClick={() => void handleReveal()}
            disabled={revealing}
          >
            {revealing ? '…' : 'Reveal word'}
          </button>
        )}

        {!won && isLiveChallenge && !wordSubmitted && (
          <div className="result-suggest">
            <label htmlFor="suggest-word" className="result-suggest__label">
              Suggest a word for later
            </label>
            <div className="result-suggest__row">
              <input
                id="suggest-word"
                type="text"
                value={suggestedWord}
                onChange={(e) => setSuggestedWord(e.target.value)}
                placeholder={`${MIN_WORD_LENGTH}–${MAX_WORD_LENGTH} letters`}
                maxLength={MAX_WORD_LENGTH}
              />
              <button
                type="button"
                onClick={() => void handleWordSubmit()}
                disabled={submitting}
              >
                {submitting ? '…' : 'Add'}
              </button>
            </div>
          </div>
        )}

        {wordSubmitted && (
          <p className="result-card__note">Word queued.</p>
        )}

        <div className="result-actions">
          {won && canShare && (
            <button
              type="button"
              className="result-btn result-btn--primary"
              onClick={() => void handleShare()}
              disabled={sharing || shared}
            >
              {sharing ? '…' : shared ? 'Shared' : 'Share puzzle'}
            </button>
          )}
          <button
            type="button"
            className={`result-btn${won ? ' result-btn--secondary' : ' result-btn--primary'}`}
            onClick={onPlayAgain}
          >
            {won ? 'Play again' : spoiled ? 'Practice again' : 'Try again'}
          </button>
          {onOpenArchive && (
            <button
              type="button"
              className="result-btn result-btn--ghost"
              onClick={onOpenArchive}
            >
              Past puzzles
            </button>
          )}
          {onBackToToday && (
            <button
              type="button"
              className="result-btn result-btn--ghost"
              onClick={onBackToToday}
            >
              Today&apos;s puzzle
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
