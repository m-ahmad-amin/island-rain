import { useCallback, useState } from 'react';
import type { DailyPuzzle } from '../../shared/puzzleConfig';
import { IslandCanvas } from './island/IslandCanvas';
import { GameProvider, useGame } from './island/GameContext';
import { GameHud } from './island/GameHud';
import { GameMenuModal } from './island/GameMenuModal';
import { HowToPlayOverlay } from './island/HowToPlayOverlay';
import { LetterBriefingOverlay } from './island/LetterBriefingOverlay';
import { CreditsScreen } from '../components/CreditsScreen';

type IslandGameProps = {
  puzzle: DailyPuzzle;
  onGameEnd: (won: boolean, timeMs: number, finalScore: number) => void;
  onOpenArchive?: () => void;
  onBackToToday?: () => void;
  isLiveChallenge?: boolean;
};

const IslandGameInner = ({
  onOpenArchive,
  onBackToToday,
  isLiveChallenge,
  hudVisible,
}: {
  onOpenArchive?: () => void;
  onBackToToday?: () => void;
  isLiveChallenge: boolean;
  hudVisible: boolean;
}) => {
  const { resetCamera } = useGame();
  const [showMenu, setShowMenu] = useState(false);
  const [showCredits, setShowCredits] = useState(false);

  return (
    <>
      <IslandCanvas />
      <GameHud visible={hudVisible} onOpenMenu={() => setShowMenu(true)} />
      <GameMenuModal
        open={showMenu}
        onClose={() => setShowMenu(false)}
        onOpenCredits={() => setShowCredits(true)}
        onResetView={resetCamera}
        {...(onOpenArchive ? { onOpenArchive } : {})}
        {...(onBackToToday ? { onBackToToday } : {})}
        isLiveChallenge={isLiveChallenge}
      />
      {showCredits && <CreditsScreen onClose={() => setShowCredits(false)} />}
    </>
  );
};

export const IslandGame = ({
  puzzle,
  onGameEnd,
  onOpenArchive,
  onBackToToday,
  isLiveChallenge = true,
}: IslandGameProps) => {
  const [showHowToPlay, setShowHowToPlay] = useState(true);
  const [showLetterBriefing, setShowLetterBriefing] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [runIntro, setRunIntro] = useState(false);

  const handleStart = () => {
    setShowHowToPlay(false);
    setShowLetterBriefing(true);
  };

  const handleBriefingComplete = useCallback(() => {
    setShowLetterBriefing(false);
    setRunIntro(true);
  }, []);

  const gameActive = !showHowToPlay && !showLetterBriefing && introDone;
  const hudVisible = gameActive;

  return (
    <GameProvider
      puzzle={puzzle}
      onGameEnd={onGameEnd}
      gameActive={gameActive}
      cameraIntroActive={runIntro && !introDone}
      onCameraIntroComplete={() => {
        setIntroDone(true);
        setRunIntro(false);
      }}
    >
      <div className="relative w-full h-full">
        <IslandGameInner
          hudVisible={hudVisible}
          isLiveChallenge={isLiveChallenge}
          {...(onOpenArchive ? { onOpenArchive } : {})}
          {...(onBackToToday ? { onBackToToday } : {})}
        />
        <HowToPlayOverlay open={showHowToPlay} onClose={handleStart} />
        <LetterBriefingOverlay
          open={showLetterBriefing}
          onComplete={handleBriefingComplete}
        />
      </div>
    </GameProvider>
  );
};
