import { context } from '@devvit/web/server';
import { isArchiveDate, isValidDateString } from '../../shared/archive';
import { getUtcDateString } from '../../shared/puzzle';
import type { PostData } from './post';

export const resolvePuzzleDate = (requestedDate?: string | null): string => {
  const today = getUtcDateString();

  if (requestedDate && isValidDateString(requestedDate)) {
    if (requestedDate === today || isArchiveDate(requestedDate)) {
      return requestedDate;
    }
  }

  const postData = context.postData as PostData | undefined;
  if (postData?.puzzleDate && isValidDateString(postData.puzzleDate)) {
    return postData.puzzleDate;
  }

  return today;
};

export const isLiveChallengeDate = (date: string): boolean =>
  date === getUtcDateString();

/** Puzzle date baked into the current post, if any. */
export const getPostPuzzleDate = (): string | null => {
  const postData = context.postData as PostData | undefined;
  if (postData?.puzzleDate && isValidDateString(postData.puzzleDate)) {
    return postData.puzzleDate;
  }
  return null;
};

/** Share only when the played puzzle matches this post's day. */
export const canSharePuzzleDate = (playedPuzzleDate: string): boolean => {
  const postDate = getPostPuzzleDate();
  return postDate !== null && postDate === playedPuzzleDate;
};
