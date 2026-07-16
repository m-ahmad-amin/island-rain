import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { getScrambledAnswerLetters } from '../../../shared/puzzle';
import { calculateWinScore } from '../../../shared/scoring';
import {
  COLLECT_LETTER_BONUS,
  DECOY_SCORE_PENALTY,
  DECOY_TIME_PENALTY_SECONDS,
  DECOY_SPAWN_INTERVAL_MS,
  LETTER_GROUND_LINGER_SECONDS,
  LETTER_SPAWN_INTERVAL_MS,
  MAX_FALLING_DECOYS,
  MAX_FALLING_LETTERS,
  STARTING_SCORE,
  type DailyPuzzle,
} from '../../../shared/puzzleConfig';
import type {
  FallingLetterData,
  GamePhase,
  IslandRefs,
  PlaySubPhase,
  TrayLetter,
} from './types';
import { useGameSounds } from './useGameSounds';

export type ScoreFlash = {
  message: string;
  kind: 'good' | 'bad';
};

type GameContextValue = {
  puzzle: DailyPuzzle;
  answerWord: string;
  scrambledLetters: string[];
  collectedMask: boolean[];
  playSubPhase: PlaySubPhase;
  phase: GamePhase;
  fallingLetters: FallingLetterData[];
  unplaced: TrayLetter[];
  assemblySlots: TrayLetter[];
  floodY: number;
  floodActive: boolean;
  elapsedSec: number;
  score: number;
  scoreFlash: ScoreFlash | null;
  islandReady: boolean;
  islandRefs: IslandRefs | null;
  setIslandRefs: (refs: IslandRefs) => void;
  registerCameraReset: (fn: () => void) => void;
  resetCamera: () => void;
  cameraIntroActive: boolean;
  completeCameraIntro: () => void;
  collectFallingLetter: (id: string) => void;
  tapFallingLetter: (id: string) => void;
  reorderAssembly: (fromIndex: number, toIndex: number) => void;
  tick: (delta: number) => void;
};

const GameContext = createContext<GameContextValue | null>(null);

export const useGame = (): GameContextValue => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
};

const randomSpawnX = (bounds: IslandRefs['spawnBounds']): number =>
  bounds.minX + Math.random() * (bounds.maxX - bounds.minX);

const randomSpawnZ = (bounds: IslandRefs['spawnBounds']): number =>
  bounds.minZ + Math.random() * (bounds.maxZ - bounds.minZ);

type GameProviderProps = {
  puzzle: DailyPuzzle;
  onGameEnd: (won: boolean, timeMs: number, finalScore: number) => void;
  gameActive?: boolean;
  cameraIntroActive?: boolean;
  onCameraIntroComplete?: () => void;
  children: ReactNode;
};

export const GameProvider = ({
  puzzle,
  onGameEnd,
  gameActive = true,
  cameraIntroActive = false,
  onCameraIntroComplete,
  children,
}: GameProviderProps) => {
  const answerWord = puzzle.answerWord.toUpperCase();
  const scrambledLetters = useMemo(
    () => getScrambledAnswerLetters(puzzle.answerWord, puzzle.date),
    [puzzle.answerWord, puzzle.date]
  );

  const { play, unlock } = useGameSounds();

  const [phase, setPhase] = useState<GamePhase>('playing');
  const [playSubPhase, setPlaySubPhase] = useState<PlaySubPhase>('collecting');
  const [collectedMask, setCollectedMask] = useState<boolean[]>(() =>
    scrambledLetters.map(() => false)
  );
  const [fallingLetters, setFallingLetters] = useState<FallingLetterData[]>([]);
  const [unplaced, setUnplaced] = useState<TrayLetter[]>([]);
  const [assemblySlots, setAssemblySlots] = useState<TrayLetter[]>([]);
  const [floodY, setFloodY] = useState(0);
  const [floodActive, setFloodActive] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [score, setScore] = useState(STARTING_SCORE);
  const [scoreFlash, setScoreFlash] = useState<ScoreFlash | null>(null);
  const [islandReady, setIslandReady] = useState(false);
  const [islandRefs, setIslandRefsState] = useState<IslandRefs | null>(null);

  const islandRefsRef = useRef<IslandRefs | null>(null);
  const spawnQueueRef = useRef<number[]>([]);
  const respawnQueueRef = useRef<number[]>([]);
  const spawnTimerRef = useRef(0);
  const decoySpawnTimerRef = useRef(0);
  const elapsedRef = useRef(0);
  const floodTargetYRef = useRef(0);
  const startFloodYRef = useRef(0);
  const endFloodYRef = useRef(0);
  const roundEndedRef = useRef(false);
  const startTimeRef = useRef(0);
  const cameraResetRef = useRef<(() => void) | null>(null);
  const timerStartedRef = useRef(false);
  const collectedMaskRef = useRef(collectedMask);
  const scoreRef = useRef(score);
  const decoyPoolRef = useRef<string[]>([]);
  const scoreFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashScore = useCallback((message: string, kind: 'good' | 'bad') => {
    if (scoreFlashTimerRef.current) clearTimeout(scoreFlashTimerRef.current);
    setScoreFlash({ message, kind });
    scoreFlashTimerRef.current = setTimeout(() => {
      setScoreFlash(null);
      scoreFlashTimerRef.current = null;
    }, 1400);
  }, []);

  const decoyPool = useMemo(() => {
    const answerSet = new Set(puzzle.answerWord.toLowerCase().split(''));
    return puzzle.decoyLetters.filter((ch) => !answerSet.has(ch.toLowerCase()));
  }, [puzzle.answerWord, puzzle.decoyLetters]);

  useEffect(() => {
    decoyPoolRef.current =
      decoyPool.length > 0 ? decoyPool : ['x', 'z', 'q', 'j', 'k'];
  }, [decoyPool]);

  useEffect(() => {
    collectedMaskRef.current = collectedMask;
  }, [collectedMask]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    if (gameActive) {
      timerStartedRef.current = true;
      startTimeRef.current = Date.now();
    }
  }, [gameActive]);

  const registerCameraReset = useCallback((fn: () => void) => {
    cameraResetRef.current = fn;
  }, []);

  const resetCamera = useCallback(() => {
    cameraResetRef.current?.();
  }, []);

  const completeCameraIntro = useCallback(() => {
    onCameraIntroComplete?.();
  }, [onCameraIntroComplete]);

  const allLettersCollected = useCallback(
    (mask: boolean[]) => mask.every(Boolean),
    []
  );

  const checkWin = useCallback(
    (slots: TrayLetter[]) => {
      if (roundEndedRef.current || playSubPhase !== 'unscrambling') return;
      if (slots.length !== answerWord.length) return;

      const spelled = slots.map((s) => s.letter).join('').toUpperCase();
      if (spelled === answerWord) {
        roundEndedRef.current = true;
        setPhase('won');
        play('win');
        const timeMs = Date.now() - startTimeRef.current;
        const finalScore = calculateWinScore(scoreRef.current, elapsedRef.current);
        setScore(finalScore);
        scoreRef.current = finalScore;
        setTimeout(() => onGameEnd(true, timeMs, finalScore), 2200);
      }
    },
    [answerWord, onGameEnd, play, playSubPhase]
  );

  const setIslandRefs = useCallback(
    (refs: IslandRefs) => {
      islandRefsRef.current = refs;
      setIslandRefsState(refs);
      startFloodYRef.current = refs.spawnBounds.waterY;
      floodTargetYRef.current = refs.boatPosition[1];
      endFloodYRef.current = refs.boatPosition[1] + 0.5;
      setFloodY(refs.spawnBounds.waterY);

      const indices = scrambledLetters.map((_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = indices[i]!;
        indices[i] = indices[j]!;
        indices[j] = tmp;
      }
      spawnQueueRef.current = indices;
      respawnQueueRef.current = [];
      spawnTimerRef.current = 0.5;
      decoySpawnTimerRef.current = 0.3;
      setIslandReady(true);
    },
    [scrambledLetters]
  );

  const endRoundLoss = useCallback(() => {
    if (roundEndedRef.current) return;
    roundEndedRef.current = true;
    setPhase('lost');
    play('lose');
    const timeMs = Date.now() - startTimeRef.current;
    setTimeout(() => onGameEnd(false, timeMs, scoreRef.current), 1800);
  }, [onGameEnd, play]);

  const trySpawnLetters = useCallback(() => {
    if (playSubPhase !== 'collecting' || roundEndedRef.current) return;

    setFallingLetters((current) => {
      const airborneCount = current.filter(
        (l) => l.kind === 'collectible' && l.state === 'falling'
      ).length;
      const activeIndices = new Set(
        current
          .filter((l) => l.kind === 'collectible' && l.wordIndex !== null)
          .map((l) => l.wordIndex!)
      );
      const queue = [...spawnQueueRef.current, ...respawnQueueRef.current];
      spawnQueueRef.current = [];
      respawnQueueRef.current = [];

      let slots = MAX_FALLING_LETTERS - airborneCount;
      const toSpawn: number[] = [];

      for (const idx of queue) {
        if (collectedMaskRef.current[idx]) continue;
        if (slots <= 0) {
          spawnQueueRef.current.push(idx);
          continue;
        }
        if (activeIndices.has(idx)) {
          respawnQueueRef.current.push(idx);
          continue;
        }
        toSpawn.push(idx);
        activeIndices.add(idx);
        slots--;
      }

      if (toSpawn.length === 0) return current;

      const refs = islandRefsRef.current;
      if (!refs) return current;

      const bounds = refs.spawnBounds;
      const spawned = toSpawn.map((wordIndex) => {
        const letter = scrambledLetters[wordIndex]!;
        return {
          id: `fall-${wordIndex}-${Math.random().toString(36).slice(2, 8)}`,
          letter,
          kind: 'collectible' as const,
          wordIndex,
          position: [
            randomSpawnX(bounds),
            bounds.spawnY + Math.random() * 1.5,
            randomSpawnZ(bounds),
          ] as [number, number, number],
          velocityY: 2.2 + Math.random() * 0.8,
          state: 'falling' as const,
          landedTime: 0,
        };
      });

      return [...current, ...spawned];
    });
  }, [playSubPhase, scrambledLetters]);

  const trySpawnDecoys = useCallback(() => {
    if (playSubPhase !== 'collecting' || roundEndedRef.current) return;

    setFallingLetters((current) => {
      const decoyCount = current.filter((l) => l.kind === 'decoy').length;
      const slots = MAX_FALLING_DECOYS - decoyCount;
      if (slots <= 0) return current;

      const refs = islandRefsRef.current;
      if (!refs) return current;

      const bounds = refs.spawnBounds;
      const pool = decoyPoolRef.current;
      const spawnCount = Math.min(slots, 2 + Math.floor(Math.random() * 2));

      const spawned = Array.from({ length: spawnCount }, () => {
        const letter =
          pool[Math.floor(Math.random() * pool.length)] ?? 'x';
        return {
          id: `decoy-${Math.random().toString(36).slice(2, 10)}`,
          letter,
          kind: 'decoy' as const,
          wordIndex: null,
          position: [
            randomSpawnX(bounds),
            bounds.spawnY + Math.random() * 2,
            randomSpawnZ(bounds),
          ] as [number, number, number],
          velocityY: 2.4 + Math.random() * 1,
          state: 'falling' as const,
          landedTime: 0,
        };
      });

      return [...current, ...spawned];
    });
  }, [playSubPhase]);

  const tapFallingLetter = useCallback(
    (id: string) => {
      if (roundEndedRef.current || playSubPhase !== 'collecting') return;
      unlock();

      setFallingLetters((prev) => {
        const found = prev.find((l) => l.id === id);
        if (!found) return prev;

        if (found.kind === 'decoy') {
          play('reject');
          elapsedRef.current += DECOY_TIME_PENALTY_SECONDS;
          setElapsedSec(Math.floor(elapsedRef.current));
          setScore((s) => {
            const next = Math.max(0, s - DECOY_SCORE_PENALTY);
            scoreRef.current = next;
            return next;
          });
          flashScore('Wrong collected — penalty', 'bad');
          return prev.filter((l) => l.id !== id);
        }

        if (found.wordIndex === null) return prev;

        play('catch');
        setScore((s) => {
          const next = s + COLLECT_LETTER_BONUS;
          scoreRef.current = next;
          return next;
        });
        flashScore(`+${COLLECT_LETTER_BONUS}`, 'good');

        const trayItem: TrayLetter = {
          id: `tray-${found.id}`,
          letter: found.letter,
        };

        const nextMask = [...collectedMaskRef.current];
        nextMask[found.wordIndex] = true;
        const allDone = allLettersCollected(nextMask);

        setCollectedMask(nextMask);
        if (allDone) {
          setUnplaced((pool) => {
            setAssemblySlots([...pool, trayItem]);
            return [];
          });
          setPlaySubPhase('unscrambling');
          play('tap');
          return [];
        }

        setUnplaced((pool) => [...pool, trayItem]);
        return prev.filter((l) => l.id !== id);
      });
    },
    [allLettersCollected, flashScore, play, playSubPhase, unlock]
  );

  const collectFallingLetter = tapFallingLetter;

  const reorderAssembly = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (roundEndedRef.current || playSubPhase !== 'unscrambling') return;
      if (fromIndex === toIndex) return;
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= assemblySlots.length ||
        toIndex >= assemblySlots.length
      ) {
        return;
      }

      unlock();
      play('tap');
      const next = [...assemblySlots];
      const [item] = next.splice(fromIndex, 1);
      if (!item) return;
      next.splice(toIndex, 0, item);
      setAssemblySlots(next);
      checkWin(next);
    },
    [assemblySlots, checkWin, play, playSubPhase, unlock]
  );

  const tick = useCallback(
    (delta: number) => {
      if (roundEndedRef.current || !gameActive) return;

      if (timerStartedRef.current) {
        elapsedRef.current += delta;
        setElapsedSec(Math.floor(elapsedRef.current));
      }

      if (playSubPhase === 'collecting' && islandRefsRef.current) {
        spawnTimerRef.current += delta;
        if (spawnTimerRef.current >= LETTER_SPAWN_INTERVAL_MS / 1000) {
          spawnTimerRef.current = 0;
          trySpawnLetters();
        }

        decoySpawnTimerRef.current += delta;
        if (decoySpawnTimerRef.current >= DECOY_SPAWN_INTERVAL_MS / 1000) {
          decoySpawnTimerRef.current = 0;
          trySpawnDecoys();
        }

        const bounds = islandRefsRef.current.spawnBounds;
        const floorY = bounds.groundY + 0.15;

        setFallingLetters((prev) => {
          const next: FallingLetterData[] = [];
          const missed: number[] = [];

          for (const letter of prev) {
            if (letter.state === 'landed') {
              const landedTime = letter.landedTime + delta;
              if (landedTime >= LETTER_GROUND_LINGER_SECONDS) {
                if (
                  letter.kind === 'collectible' &&
                  letter.wordIndex !== null &&
                  !collectedMaskRef.current[letter.wordIndex]
                ) {
                  missed.push(letter.wordIndex);
                }
                continue;
              }
              next.push({ ...letter, landedTime });
              continue;
            }

            const y = letter.position[1] - letter.velocityY * delta;
            if (y <= floorY) {
              next.push({
                ...letter,
                state: 'landed',
                landedTime: 0,
                velocityY: 0,
                position: [letter.position[0], floorY, letter.position[2]],
              });
              continue;
            }

            next.push({
              ...letter,
              position: [letter.position[0], y, letter.position[2]],
            });
          }

          if (missed.length > 0) {
            respawnQueueRef.current.push(...missed);
          }

          return next;
        });
      }

      if (!floodActive && elapsedRef.current >= puzzle.floodDelaySeconds) {
        setFloodActive(true);
        play('flood');
      }

      if (floodActive && islandRefsRef.current) {
        const riseProgress = Math.min(
          1,
          (elapsedRef.current - puzzle.floodDelaySeconds) /
            puzzle.floodRiseSeconds
        );
        const eased = riseProgress * riseProgress;
        const newY =
          startFloodYRef.current +
          (endFloodYRef.current - startFloodYRef.current) * eased;
        setFloodY(newY);

        if (newY >= floodTargetYRef.current) {
          endRoundLoss();
        }
      }
    },
    [
      endRoundLoss,
      floodActive,
      play,
      playSubPhase,
      puzzle.floodDelaySeconds,
      puzzle.floodRiseSeconds,
      trySpawnLetters,
      trySpawnDecoys,
      gameActive,
    ]
  );

  const value = useMemo(
    () => ({
      puzzle,
      answerWord,
      scrambledLetters,
      collectedMask,
      playSubPhase,
      phase,
      fallingLetters,
      unplaced,
      assemblySlots,
      floodY,
      floodActive,
      elapsedSec,
      score,
      scoreFlash,
      islandReady,
      islandRefs,
      setIslandRefs,
      registerCameraReset,
      resetCamera,
      cameraIntroActive,
      completeCameraIntro,
      collectFallingLetter,
      tapFallingLetter,
      reorderAssembly,
      tick,
    }),
    [
      puzzle,
      answerWord,
      scrambledLetters,
      collectedMask,
      playSubPhase,
      phase,
      fallingLetters,
      unplaced,
      assemblySlots,
      floodY,
      floodActive,
      elapsedSec,
      score,
      scoreFlash,
      islandReady,
      islandRefs,
      setIslandRefs,
      registerCameraReset,
      resetCamera,
      cameraIntroActive,
      completeCameraIntro,
      collectFallingLetter,
      tapFallingLetter,
      reorderAssembly,
      tick,
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
