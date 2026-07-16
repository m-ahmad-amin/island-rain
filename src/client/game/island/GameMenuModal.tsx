type GameMenuModalProps = {
  open: boolean;
  onClose: () => void;
  onOpenCredits: () => void;
  onResetView: () => void;
  onOpenArchive?: () => void;
  onBackToToday?: () => void;
  isLiveChallenge?: boolean;
};

export const GameMenuModal = ({
  open,
  onClose,
  onOpenCredits,
  onResetView,
  onOpenArchive,
  onBackToToday,
  isLiveChallenge = true,
}: GameMenuModalProps) => {
  if (!open) return null;

  const pick = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div className="game-menu" role="dialog" aria-modal="true" aria-labelledby="game-menu-title">
      <button
        type="button"
        className="game-menu__backdrop"
        aria-label="Close menu"
        onClick={onClose}
      />
      <div className="game-menu__sheet">
        <header className="game-menu__header">
          <h2 id="game-menu-title" className="game-menu__title">
            Menu
          </h2>
          <button type="button" className="game-menu__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="game-menu__actions">
          {onBackToToday && (
            <button type="button" className="game-menu__btn" onClick={() => pick(onBackToToday)}>
              Today&apos;s puzzle
            </button>
          )}
          {isLiveChallenge && onOpenArchive && (
            <button type="button" className="game-menu__btn" onClick={() => pick(onOpenArchive)}>
              Past puzzles
            </button>
          )}
          <button type="button" className="game-menu__btn" onClick={() => pick(onResetView)}>
            Reset camera
          </button>
          <button type="button" className="game-menu__btn" onClick={() => pick(onOpenCredits)}>
            Credits
          </button>
        </div>
      </div>
    </div>
  );
};
