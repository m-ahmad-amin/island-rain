import { reddit, redis } from '@devvit/web/server';
import { getUtcDateString } from '../../shared/puzzle';

export type PostData = {
  puzzleDate: string;
};

export const formatPostTitle = (date: string): string => {
  const d = new Date(`${date}T12:00:00.000Z`);
  const label = d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return `Island Rain — ${label}`;
};

export const createDailyPost = async (date?: string) => {
  const puzzleDate = date ?? getUtcDateString();

  const post = await reddit.submitCustomPost({
    title: formatPostTitle(puzzleDate),
    entry: 'default',
    postData: { puzzleDate },
  });

  await redis.set(`daily-post:${puzzleDate}`, post.id);

  return post;
};

/** @deprecated Use createDailyPost */
export const createPost = createDailyPost;
