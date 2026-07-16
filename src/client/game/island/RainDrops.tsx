import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RAIN_DROP_COUNT } from '../../../shared/puzzleConfig';
import { useGame } from './GameContext';

type DropState = {
  x: number;
  z: number;
  y: number;
  speed: number;
  wobble: number;
};

const dummy = new THREE.Object3D();

export const RainDrops = () => {
  const { islandReady, islandRefs, floodY } = useGame();
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dropsRef = useRef<DropState[]>([]);

  const bounds = islandRefs?.spawnBounds;

  useEffect(() => {
    if (!bounds) return;
    dropsRef.current = Array.from({ length: RAIN_DROP_COUNT }, () => ({
      x: bounds.minX + Math.random() * (bounds.maxX - bounds.minX),
      z: bounds.minZ + Math.random() * (bounds.maxZ - bounds.minZ),
      y: bounds.spawnY * (0.3 + Math.random() * 0.7),
      speed: 4.5 + Math.random() * 5,
      wobble: Math.random() * Math.PI * 2,
    }));
  }, [bounds]);

  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.035, 5, 5);
    geo.scale(1, 2.2, 1);
    return geo;
  }, []);

  useFrame(({ clock }, delta) => {
    const mesh = meshRef.current;
    if (!mesh || !bounds || !islandReady) return;

    const t = clock.elapsedTime;
    const floorY = Math.max(bounds.waterY, floodY) - 0.2;

    for (let i = 0; i < dropsRef.current.length; i++) {
      const drop = dropsRef.current[i]!;
      drop.y -= drop.speed * delta;
      drop.x += Math.sin(t * 2.2 + drop.wobble) * delta * 0.15;

      if (drop.y < floorY) {
        drop.y = bounds.spawnY + Math.random() * 2;
        drop.x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
        drop.z = bounds.minZ + Math.random() * (bounds.maxZ - bounds.minZ);
        drop.speed = 4.5 + Math.random() * 5;
      }

      dummy.position.set(drop.x, drop.y, drop.z);
      dummy.rotation.set(0, 0, Math.sin(t * 3 + drop.wobble) * 0.08);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (!islandReady || !bounds) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, RAIN_DROP_COUNT]}
      frustumCulled={false}
    >
      <meshStandardMaterial
        color="#a8dce8"
        emissive="#6bb8e8"
        emissiveIntensity={0.25}
        transparent
        opacity={0.55}
        roughness={0.15}
        metalness={0.05}
      />
    </instancedMesh>
  );
};
