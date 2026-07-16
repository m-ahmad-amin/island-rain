import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { IslandCamera } from './IslandCamera';
import { useGame } from './GameContext';
import {
  FloodWater,
  IslandModel,
  SceneLighting,
} from './IslandEnvironment';
import { RainDrops } from './RainDrops';
import { FallingLetters } from './FallingLetters';
import { BoatLetterAnchor } from './BoatLetters';
import { COLORS, ISLAND_NODES } from './islandNodes';

export const IslandScene3D = () => {
  const { tick, phase } = useGame();
  const boatAnchorRef = useRef<THREE.Group>(null);
  const { scene } = useThree();

  useFrame((_, delta) => {
    tick(delta);

    if (boatAnchorRef.current) {
      const boats = scene.getObjectByName(ISLAND_NODES.boats);
      if (boats) {
        boats.updateWorldMatrix(true, false);
        boats.getWorldPosition(boatAnchorRef.current.position);
        boatAnchorRef.current.position.y += 0.45;
      }
    }
  });

  return (
    <>
      <SceneLighting />
      <IslandCamera />
      <IslandModel />
      <FloodWater />
      <RainDrops />
      <FallingLetters />
      <group ref={boatAnchorRef}>
        <BoatLetterAnchor />
      </group>
      {phase === 'won' && (
        <fog attach="fog" args={[COLORS.fog, 40, 90]} />
      )}
    </>
  );
};
