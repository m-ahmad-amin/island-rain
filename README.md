# Island Rain
A daily 3D word-puzzle game for Reddit, built on the [Devvit](https://developers.reddit.com/) developer platform. Rain letters onto a low-poly island, catch the ones you need, and unscramble the hidden word before the rising flood swallows your beach.

Each day a new puzzle is posted to the community. Players race the clock, climb time- and score-based leaderboards, and share their results back to the comments.
![island-rain](https://res.cloudinary.com/dzzrxqiho/image/upload/v1783416698/Group_9_4_ef1awn.png)
## Daily Hook:
If you fail to complete puzzle you can suggest upcoming day's puzzle.

## Gameplay
![game-play](https://res.cloudinary.com/dzzrxqiho/image/upload/v1783416904/Group_6_5_mehcue.png)
1. **Briefing**: the scrambled target letters are shown for a few seconds. Memorize them.
2. **Collect**: letters fall with the rain on your island. Tap the ones you need (`+15` each). Decoy letters cost score **and** add a time penalty.
3. **Unscramble**: once every letter is collected, drag the tiles into the correct order.
4. **Escape**: solve the word before the flood reaches the island to bank an escape bonus plus a speed bonus.

Miss the deadline and the water wins.

### Modes

- **Daily challenge**: today's puzzle, the only run that counts toward the live leaderboards.
- **Archive**: replay past puzzles for practice (results are not ranked).
![screens](https://res.cloudinary.com/dzzrxqiho/image/upload/v1783417549/Group_6_6_bjii0x.png)

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | [React 19](https://react.dev/), [Tailwind CSS 4](https://tailwindcss.com/), [Vite](https://vite.dev/) |
| 3D | [Three.js](https://threejs.org/) via [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) & [drei](https://github.com/pmndrs/drei) |
| Backend | Node.js 22 serverless (Devvit), [Hono](https://hono.dev/) |
| Storage | Redis (Devvit) |
| Platform | [Devvit Web](https://developers.reddit.com/docs/capabilities/devvit-web/devvit_web_overview) |
| Language | [TypeScript](https://www.typescriptlang.org/) |

## Project Structure

```
src/
├── client/                 # Frontend (runs in an iframe on reddit.com)
│   ├── splash.html         # Inline feed view, kept lightweight
│   ├── game.html           # Expanded game view (heavy 3D lives here)
│   ├── components/         # Result, archive, and credits screens
│   ├── hooks/              # useGameApi | client/server data layer
│   └── game/island/        # 3D scene, HUD, game loop, and state
├── server/                 # Backend (secure serverless environment)
│   ├── index.ts            # Hono app entry point
│   ├── routes/             # API, menu, triggers, and scheduler routes
│   └── core/               # Puzzle generation, leaderboards, sharing
└── shared/                 # Types and logic shared across client & server
    ├── puzzleConfig.ts     # Difficulty knobs and word pools
    ├── puzzle.ts           # Deterministic daily-puzzle generation
    ├── scoring.ts          # Score calculation
    └── wordValidation.ts   # Word suggestion validation
```

## How It Works

### Daily puzzles

Each day's word is generated **deterministically from the date** (a seeded PRNG), then cached in Redis under a versioned key (`puzzle:v{N}:{date}`). This keeps the puzzle stable for everyone on a given day while letting the word pools evolve over time. Words are drawn from a curated "hard" pool (tricky, repeated-letter words) and capped at seven letters.

Posts are created automatically via a scheduled task (cron), on app install, and through a moderator menu action. The target date for a post is stored in its `postData`.

### Leaderboards

Two Redis sorted sets per day track the fastest times and highest scores. Only live daily runs (not archive replays, and not runs where the answer was revealed) are eligible.

### Sharing

Winners can post their result as a comment on the puzzle post, submitted on the player's behalf (`runAs: 'USER'`). Sharing is only allowed when the played puzzle matches the post the player opened.


## Credits

- **3D Island Environment**: "Low Poly Island Environment" by Umar, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) ([Sketchfab](https://sketchfab.com/3d-models/low-poly-island-environment-38054c51a53e4487840a62baf60c53be)).
- **Splash Screen Image**: By freepik

## License

BSD-3-Clause.
