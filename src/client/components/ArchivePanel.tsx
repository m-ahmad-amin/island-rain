import { formatArchiveLabel } from '../../shared/archive';

type ArchivePanelProps = {
  dates: string[];
  onSelect: (date: string) => void;
  onClose: () => void;
};

export const ArchivePanel = ({ dates, onSelect, onClose }: ArchivePanelProps) => {
  return (
    <div className="archive-panel" role="dialog" aria-modal="true">
      <div className="archive-panel__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="archive-panel__card">
        <h2 className="archive-panel__title">Past puzzles</h2>
        <p className="archive-panel__hint">
          Past challenges | Scores won&apos;t count on the leaderboard.
        </p>
        <ul className="archive-panel__list">
          {dates.length === 0 && (
            <li className="archive-panel__empty">No archive puzzles yet.</li>
          )}
          {dates.map((date) => (
            <li key={date}>
              <button
                type="button"
                className="archive-panel__item"
                onClick={() => onSelect(date)}
              >
                {formatArchiveLabel(date)}
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="archive-panel__close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};
