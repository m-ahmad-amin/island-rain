export type PlaySubPhase = 'collecting' | 'unscrambling';

export type FallingLetterKind = 'collectible' | 'decoy';

export type FallingLetterState = 'falling' | 'landed';

export type FallingLetterData = {
  id: string;
  letter: string;
  kind: FallingLetterKind;
  wordIndex: number | null;
  position: [number, number, number];
  velocityY: number;
  state: FallingLetterState;
  landedTime: number;
};

export type TrayLetter = {
  id: string;
  letter: string;
};

export type GamePhase = 'playing' | 'won' | 'lost';

export type IslandRefs = {
  boatPosition: [number, number, number];
  boatScale: number;
  floodPlaneSize: number;
  spawnBounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
    groundY: number;
    waterY: number;
    spawnY: number;
  };
};
