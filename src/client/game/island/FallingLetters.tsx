import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from './GameContext';
import { LetterRainCharm } from './LetterSprite';
import type { FallingLetterData } from './types';

type FallingLetterDropProps = {
  data: FallingLetterData;
};

const FallingLetterCharm = ({ data }: FallingLetterDropProps) => {
  const { tapFallingLetter } = useGame();
  const [hovered, setHovered] = useState(false);
  const bobRef = useRef<THREE.Group>(null);

  const landed = data.state === 'landed';
  const charmSize = landed ? 0.62 : 0.72;

  useFrame(({ clock }, delta) => {
    if (!bobRef.current || landed) return;
    bobRef.current.position.y = Math.sin(clock.elapsedTime * 2.2) * 0.04;
    bobRef.current.rotation.z += delta * 0.15;
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    tapFallingLetter(data.id);
  };

  return (
    <group position={data.position} scale={hovered ? 1.12 : 1}>
      <mesh
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.52, 10, 10]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <group ref={bobRef}>
        <LetterRainCharm letter={data.letter} size={charmSize} />
      </group>

      {hovered && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, landed ? 0.02 : -0.1, 0]}>
          <ringGeometry args={[0.42, 0.6, 32]} />
          <meshBasicMaterial
            color="#f5c842"
            transparent
            opacity={0.5}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
};

export const FallingLetters = () => {
  const { fallingLetters, islandReady, playSubPhase } = useGame();

  if (!islandReady || playSubPhase !== 'collecting') return null;

  return (
    <>
      {fallingLetters.map((letter) => (
        <FallingLetterCharm key={letter.id} data={letter} />
      ))}
    </>
  );
};
