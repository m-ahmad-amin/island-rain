import { useState } from 'react';
import type { DailyPuzzle } from '../../shared/puzzleConfig';
import { IslandCanvas } from './island/IslandCanvas';
import { GameProvider } from './island/GameContext';
import { GameHud } from './island/GameHud';
import { HowToPlayOverlay } from './island/HowToPlayOverlay';
import { CreditsScreen } from '../components/CreditsScreen';

type IslandGameProps = {
  puzzle: DailyPuzzle;
  onGameEnd: (won: boolean, timeMs: number, finalScore: number) => void;
  onOpenArchive?: () => void;
  onBackToToday?: () => void;
  isLiveChallenge?: boolean;
};

export const IslandGame = ({
  puzzle,
  onGameEnd,
  onOpenArchive,
  onBackToToday,
  isLiveChallenge = true,
}: IslandGameProps) => {
  const [showCredits, setShowCredits] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(true);

  return (
    <GameProvider
      puzzle={puzzle}
      onGameEnd={onGameEnd}
      gameActive={!showHowToPlay}
    >
      <div className="relative w-full h-full">
        <IslandCanvas />
        <HowToPlayOverlay
          open={showHowToPlay}
          onClose={() => setShowHowToPlay(false)}
        />
        <GameHud
          onOpenCredits={() => setShowCredits(true)}
          {...(onOpenArchive ? { onOpenArchive } : {})}
          {...(onBackToToday ? { onBackToToday } : {})}
          isLiveChallenge={isLiveChallenge}
        />
        {showCredits && (
          <CreditsScreen onClose={() => setShowCredits(false)} />
        )}
      </div>
    </GameProvider>
  );
};
