import { useGame } from './GameContext';

type HowToPlayOverlayProps = {
  open: boolean;
  onClose: () => void;
};

export const HowToPlayOverlay = ({ open, onClose }: HowToPlayOverlayProps) => {
  const { islandReady } = useGame();

  if (!open) return null;

  return (
    <div className="how-to-play-overlay" role="dialog" aria-modal="true" aria-labelledby="how-to-play-title">
      <div className="how-to-play-overlay__backdrop" aria-hidden="true" />

      <div className="how-to-play-overlay__card">
        <div className="how-to-play-overlay__glow" aria-hidden="true" />

        <header className="how-to-play-overlay__header">
          <h2 id="how-to-play-title" className="how-to-play-overlay__title">
            How to Play
          </h2>
        </header>

        <ol className="how-to-play-overlay__steps">
          <li className="how-to-play-overlay__step how-to-play-overlay__step--1">
            <span className="how-to-play-overlay__step-icon" aria-hidden="true">
              ☔
            </span>
            <div>
              <p className="how-to-play-overlay__step-title">Memorize and Catch letters in the rain</p>
              <p className="how-to-play-overlay__step-desc">
                Tap letters from the rain you need (+15 each). Wrong letters add a time
                and score penalty.
              </p>
            </div>
          </li>
          <li className="how-to-play-overlay__step how-to-play-overlay__step--2">
            <span className="how-to-play-overlay__step-icon" aria-hidden="true">
              🧩
            </span>
            <div>
              <p className="how-to-play-overlay__step-title">Unscramble today&apos;s word</p>
              <p className="how-to-play-overlay__step-desc">
                Unscramble the word before the water reaches the island.
              </p>
            </div>
          </li>
          {/* <li className="how-to-play-overlay__step how-to-play-overlay__step--3">
            <span className="how-to-play-overlay__step-icon" aria-hidden="true">
              🌊
            </span>
            <div>
              <p className="how-to-play-overlay__step-title">Escape before the flood</p>
              <p className="how-to-play-overlay__step-desc">
                You have 3 minutes before the water rises. Escape earns 500 pts plus
                a speed bonus.
              </p>
            </div>
          </li> */}
        </ol>

        <div className="how-to-play-overlay__loader">
          <div className="how-to-play-overlay__loader-art" aria-hidden="true">
            <div className="how-to-play-overlay__island">
              <div className="how-to-play-overlay__sand" />
              <div className="how-to-play-overlay__grass" />
              <div className="how-to-play-overlay__palm" />
            </div>
            <span className="how-to-play-overlay__rain how-to-play-overlay__rain--1" />
            <span className="how-to-play-overlay__rain how-to-play-overlay__rain--2" />
            <span className="how-to-play-overlay__rain how-to-play-overlay__rain--3" />
            <span className="how-to-play-overlay__rain how-to-play-overlay__rain--4" />
          </div>

          <div className="how-to-play-overlay__progress-track">
            <div
              className={`how-to-play-overlay__progress-fill${
                islandReady ? ' how-to-play-overlay__progress-fill--done' : ''
              }`}
            />
          </div>

          <p className="how-to-play-overlay__status">
            {islandReady ? 'Island ready! Finish before the water reaches the island.' : 'Building your 3D island…'}
          </p>
        </div>

        <div className="how-to-play-overlay__actions">
          <button
            type="button"
            className="how-to-play-overlay__ok"
            disabled={!islandReady}
            onClick={onClose}
          >
            {islandReady ? "Let's Start!" : 'Loading…'}
          </button>
        </div>
      </div>
    </div>
  );
};
