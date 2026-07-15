import { formatArchiveLabel } from '../../shared/archive';

export const formatShareTime = (timeMs: number): string => {
  const totalSec = Math.floor(timeMs / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  const ms = Math.floor((timeMs % 1000) / 10);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

export const buildShareComment = (
  timeMs: number,
  score: number,
  puzzleDate: string,
  isArchive: boolean
): string => {
  const dateLabel = isArchive ? formatArchiveLabel(puzzleDate) : 'Today';
  return `Island Rain · ${dateLabel}\nEscaped in ${formatShareTime(timeMs)} — ${score} pts`;
};
