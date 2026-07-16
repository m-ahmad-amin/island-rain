import { useGame } from './GameContext';
import { UnscrambleDock } from './UnscrambleDock';

type GameHudProps = {
  visible: boolean;
  onOpenMenu: () => void;
};

const formatCountdown = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const GameHud = ({ visible, onOpenMenu }: GameHudProps) => {
  const {
    score,
    scoreFlash,
    floodActive,
    puzzle,
    scrambledLetters,
    collectedMask,
    playSubPhase,
    phase,
    islandReady,
    elapsedSec,
  } = useGame();

  const floodRemaining = Math.max(0, puzzle.floodDelaySeconds - elapsedSec);
  const collectedCount = collectedMask.filter(Boolean).length;
  const totalLetters = scrambledLetters.length;

  const showCollectDock =
    phase === 'playing' && islandReady && playSubPhase === 'collecting';

  if (!visible) return null;

  return (
    <div className="game-hud">
      {phase === 'playing' && (
        <header className="game-hud__bar">
          <div className="game-hud__stats">
            <div className="game-hud__pill game-hud__pill--score">
              <span className="game-hud__pill-label">Score</span>
              <span className="game-hud__pill-value">{score}</span>
            </div>
            {!floodActive ? (
              <div
                className={`game-hud__pill game-hud__pill--flood${
                  floodRemaining <= 30 ? ' game-hud__pill--urgent' : ''
                }`}
              >
                <span className="game-hud__pill-label">Flood</span>
                <span className="game-hud__pill-value">{formatCountdown(floodRemaining)}</span>
              </div>
            ) : (
              <div className="game-hud__pill game-hud__pill--rising">
                <span className="game-hud__pill-value">Water rising</span>
              </div>
            )}
          </div>
          <button
            type="button"
            className="game-hud__menu-btn"
            onClick={onOpenMenu}
            aria-label="Open menu"
          >
            ☰
          </button>
        </header>
      )}

      {scoreFlash && (
        <p
          className={`game-feedback game-feedback--${
            scoreFlash.kind === 'good' ? 'good' : 'bad'
          }`}
        >
          {scoreFlash.message}
        </p>
      )}

      {/* {islandReady && phase === 'playing' && playSubPhase === 'collecting' && (
        <div className="game-banner game-banner--hint">
          Tap glowing letters you need · wrong ones cost score
        </div>
      )} */}

      {phase === 'won' && (
        <div className="game-banner game-banner--success">Escaped!</div>
      )}
      {phase === 'lost' && (
        <div className="game-banner game-banner--danger">The flood reached you…</div>
      )}

      {showCollectDock && (
        <div className="collect-dock">
          <p className="collect-dock__progress collect-dock__progress--solo">
            {collectedCount}/{totalLetters} collected
          </p>
        </div>
      )}

      {playSubPhase === 'unscrambling' && phase === 'playing' && <UnscrambleDock />}
    </div>
  );
};
