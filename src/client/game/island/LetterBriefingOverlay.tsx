import { useEffect, useState } from 'react';
import { LETTER_BRIEFING_SECONDS } from '../../../shared/puzzleConfig';
import { useGame } from './GameContext';

type LetterBriefingOverlayProps = {
  open: boolean;
  onComplete: () => void;
};

export const LetterBriefingOverlay = ({
  open,
  onComplete,
}: LetterBriefingOverlayProps) => {
  const { scrambledLetters } = useGame();
  const [secondsLeft, setSecondsLeft] = useState(LETTER_BRIEFING_SECONDS);

  useEffect(() => {
    if (!open) return;

    const tick = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);

    const done = setTimeout(() => {
      onComplete();
    }, LETTER_BRIEFING_SECONDS * 1000);

    return () => {
      clearInterval(tick);
      clearTimeout(done);
    };
  }, [open, onComplete]);

  if (!open) return null;

  return (
    <div
      className="letter-briefing"
      role="dialog"
      aria-modal="true"
      aria-labelledby="letter-briefing-title"
    >
      <div className="letter-briefing__backdrop" aria-hidden="true" />

      <div className="letter-briefing__card">
        <p className="letter-briefing__eyebrow">Memorize these letters</p>
        <h2 id="letter-briefing-title" className="letter-briefing__title">
          Collect these from the rain
        </h2>

        <div className="letter-briefing__letters">
          {scrambledLetters.map((ch, i) => (
            <span
              key={`brief-letter-${ch}-${i}`}
              className="letter-briefing__letter"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              {ch.toUpperCase()}
            </span>
          ))}
        </div>

        <p className="letter-briefing__note">
          They won&apos;t stay on screen. Watch the counter while you play.
        </p>

        <div className="letter-briefing__timer" aria-live="polite">
          Starting in {secondsLeft}s…
        </div>
      </div>
    </div>
  );
};
