import { Hono } from 'hono';
import type { TaskResponse } from '@devvit/web/server';
import { createDailyPost } from '../core/post';
import { getOrCreateDailyPuzzle, getUtcDateString } from '../core/puzzleService';

export const scheduler = new Hono();

scheduler.post('/daily-post', async (c) => {
  try {
    const date = getUtcDateString();
    await getOrCreateDailyPuzzle(date);
    const post = await createDailyPost(date);

    return c.json<TaskResponse>(
      {
        status: 'success',
        message: `Daily post created for ${date}: ${post.id}`,
      },
      200
    );
  } catch (error) {
    console.error('Daily post scheduler error:', error);
    return c.json<TaskResponse>(
      { status: 'error', message: 'Failed to create daily post' },
      500
    );
  }
});
