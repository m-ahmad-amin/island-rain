import './index.css';

import { StrictMode, lazy, Suspense, useCallback, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ResultScreen } from './components/ResultScreen';
import { ArchivePanel } from './components/ArchivePanel';
import { useGameApi } from './hooks/useGameApi';
import type { DailyPuzzle } from '../shared/puzzleConfig';

const IslandGame = lazy(() =>
  import('./game/IslandGame').then((m) => ({ default: m.IslandGame }))
);

type GamePhase = 'playing' | 'result';

export const App = () => {
  const {
    puzzle,
    puzzleDate,
    isArchive,
    isLiveChallenge,
    canShare,
    stats,
    timeLeaderboard,
    scoreLeaderboard,
    archiveDates,
    loading,
    error,
    loadArchivePuzzle,
    loadLivePuzzle,
    submitResult,
    revealAnswer,
    submitWordSuggestion,
    shareResult,
  } = useGameApi();
  const [phase, setPhase] = useState<GamePhase>('playing');
  const [gameKey, setGameKey] = useState(0);
  const [won, setWon] = useState(false);
  const [timeMs, setTimeMs] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [timeRank, setTimeRank] = useState<number | null>(null);
  const [scoreRank, setScoreRank] = useState<number | null>(null);
  const [countsForLeaderboard, setCountsForLeaderboard] = useState(false);
  const [showArchive, setShowArchive] = useState(false);

  const handleGameEnd = useCallback(
    async (didWin: boolean, elapsed: number, score: number) => {
      setWon(didWin);
      setTimeMs(elapsed);
      setFinalScore(score);
      setPhase('result');

      const data = await submitResult({
        won: didWin,
        timeMs: elapsed,
        score,
        archive: isArchive,
      });

      if (data) {
        setTimeRank(data.timeRank);
        setScoreRank(data.scoreRank);
        setCountsForLeaderboard(data.countsForLeaderboard);
      }
    },
    [isArchive, submitResult]
  );

  const handlePlayAgain = () => {
    setPhase('playing');
    setGameKey((k) => k + 1);
    setTimeRank(null);
    setScoreRank(null);
  };

  const handleSelectArchive = async (date: string) => {
    setShowArchive(false);
    setPhase('playing');
    await loadArchivePuzzle(date);
    setGameKey((k) => k + 1);
  };

  const handleBackToToday = async () => {
    setPhase('playing');
    await loadLivePuzzle();
    setGameKey((k) => k + 1);
  };

  const handleSubmitWord = async (
    word: string
  ): Promise<{ accepted: boolean; message: string }> => {
    const res = await submitWordSuggestion(word);
    return {
      accepted: res?.accepted ?? false,
      message: res?.message ?? 'Could not submit word — try again',
    };
  };

  const handleRevealAnswer = async (): Promise<string | null> => {
    const res = await revealAnswer();
    return res?.answerWord ?? null;
  };

  const handleSharePuzzle = async () => {
    return shareResult({
      won,
      timeMs,
      score: finalScore,
    });
  };

  if (loading && !puzzle) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1a2744]">
        <p className="text-[#f5e6c8] font-serif text-lg animate-pulse">
          Loading puzzle...
        </p>
      </div>
    );
  }

  if (error || !puzzle) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1a2744] p-4">
        <p className="text-[#a8dce8] text-center">
          {error ?? 'Could not load puzzle'}
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-[#1a2744] overflow-hidden">
      {/* {isArchive && phase === 'playing' && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 archive-badge pointer-events-none">
          Archive · {formatArchiveLabel(puzzleDate)}
        </div>
      )} */}

      {phase === 'playing' && (
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full">
              <p className="text-[#f5e6c8] font-serif animate-pulse">
                Loading 3D island…
              </p>
            </div>
          }
        >
          <IslandGame
            key={gameKey}
            puzzle={puzzle as DailyPuzzle}
            onGameEnd={handleGameEnd}
            onOpenArchive={() => setShowArchive(true)}
            {...(isArchive
              ? { onBackToToday: () => void handleBackToToday() }
              : {})}
            isLiveChallenge={isLiveChallenge}
          />
        </Suspense>
      )}

      {phase === 'result' && (
        <ResultScreen
          won={won}
          timeMs={timeMs}
          finalScore={finalScore}
          puzzle={puzzle}
          stats={stats}
          timeLeaderboard={timeLeaderboard}
          scoreLeaderboard={scoreLeaderboard}
          timeRank={timeRank}
          scoreRank={scoreRank}
          countsForLeaderboard={countsForLeaderboard}
          isLiveChallenge={isLiveChallenge}
          isArchive={isArchive}
          puzzleDate={puzzleDate}
          canShare={canShare}
          onPlayAgain={handlePlayAgain}
          onSubmitWord={handleSubmitWord}
          onRevealAnswer={handleRevealAnswer}
          onSharePuzzle={handleSharePuzzle}
          onOpenArchive={() => setShowArchive(true)}
          {...(isArchive
            ? { onBackToToday: () => void handleBackToToday() }
            : {})}
        />
      )}

      {showArchive && (
        <ArchivePanel
          dates={archiveDates}
          onSelect={(date) => void handleSelectArchive(date)}
          onClose={() => setShowArchive(false)}
        />
      )}
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
