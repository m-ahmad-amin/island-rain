import { useCallback, useRef } from 'react';

type ToneDef = {
  frequencies: number[];
  duration: number;
  volume?: number;
};

const TONES: Record<string, ToneDef> = {
  catch: { frequencies: [523, 659, 784], duration: 0.18, volume: 0.22 },
  splash: { frequencies: [180, 120, 90], duration: 0.35, volume: 0.28 },
  flood: { frequencies: [220, 165], duration: 0.6, volume: 0.2 },
  win: { frequencies: [392, 494, 587, 784], duration: 0.55, volume: 0.24 },
  lose: { frequencies: [330, 262, 196], duration: 0.7, volume: 0.22 },
  tap: { frequencies: [440], duration: 0.06, volume: 0.1 },
  reject: { frequencies: [200, 150], duration: 0.15, volume: 0.18 },
};

const playTone = (ctx: AudioContext, def: ToneDef): void => {
  const volume = def.volume ?? 0.2;
  const now = ctx.currentTime;
  for (let i = 0; i < def.frequencies.length; i++) {
    const freq = def.frequencies[i]!;
    const start = now + i * 0.07;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, start + def.duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + def.duration + 0.05);
  }
};

export const useGameSounds = () => {
  const ctxRef = useRef<AudioContext | null>(null);

  const ensureContext = useCallback((): AudioContext | null => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === 'suspended') {
      void ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const play = useCallback(
    (key: keyof typeof TONES) => {
      const ctx = ensureContext();
      if (!ctx) return;
      const def = TONES[key];
      if (def) playTone(ctx, def);
    },
    [ensureContext]
  );

  return { play, unlock: ensureContext };
};
