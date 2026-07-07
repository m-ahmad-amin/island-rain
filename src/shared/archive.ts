import { ARCHIVE_START_DATE } from './puzzleConfig';
import { getUtcDateString } from './puzzle';

export const isValidDateString = (date: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(date);

export const isArchiveDate = (date: string): boolean => {
  if (!isValidDateString(date)) return false;
  const today = getUtcDateString();
  return date >= ARCHIVE_START_DATE && date < today;
};

export const getArchiveDates = (): string[] => {
  const dates: string[] = [];
  const start = new Date(`${ARCHIVE_START_DATE}T00:00:00.000Z`);
  const today = new Date(`${getUtcDateString()}T00:00:00.000Z`);

  for (let d = new Date(start); d < today; d.setUTCDate(d.getUTCDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10));
  }

  return dates.reverse();
};

export const formatArchiveLabel = (date: string): string => {
  const d = new Date(`${date}T12:00:00.000Z`);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
};
