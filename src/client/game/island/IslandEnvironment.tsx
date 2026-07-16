import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { COLORS, ISLAND_GLB_URL, ISLAND_NODES } from './islandNodes';
import { useGame } from './GameContext';
import { enhanceGlbScene } from './glbMaterialFix';
import type { IslandRefs } from './types';

const TARGET_SIZE = 14;

/** Distant copies — visual only, no rain or letter spawns */
const BACKGROUND_ISLAND_POSITIONS: [number, number, number][] = [
  [0, 0, -30],
  [26, 0, 16],
  [-26, 0, 16],
];

const prepareIslandClone = (source: THREE.Object3D): THREE.Object3D => {
  const template = source.clone(true);

  const box = new THREE.Box3().setFromObject(template);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const scale = TARGET_SIZE / Math.max(size.x, size.z, 0.001);
  template.scale.setScalar(scale);
  template.position.set(
    -center.x * scale,
    -box.min.y * scale,
    -center.z * scale
  );
  template.updateMatrixWorld(true);

  return template;
};

export const IslandModel = () => {
  const { scene } = useLoader(GLTFLoader, ISLAND_GLB_URL);
  const { setIslandRefs, phase } = useGame();
  const groupRef = useRef<THREE.Group>(null);
  const boatRef = useRef<THREE.Object3D | null>(null);
  const refsSetRef = useRef(false);

  const preparedTemplate = useMemo(() => {
    enhanceGlbScene(scene, 16);
    const clone = scene.clone(true);
    return prepareIslandClone(clone);
  }, [scene]);

  const backgroundIslands = useMemo(
    () =>
      BACKGROUND_ISLAND_POSITIONS.map((position, index) => {
        const inst = preparedTemplate.clone(true);
        const boats = inst.getObjectByName(ISLAND_NODES.boats);
        if (boats) {
          boats.name = `BoatsBg-${index}`;
          boats.visible = false;
        }
        return { position, object: inst };
      }),
    [preparedTemplate]
  );

  useEffect(() => {
    const scaledBox = new THREE.Box3().setFromObject(preparedTemplate);

    const boats =
      preparedTemplate.getObjectByName(ISLAND_NODES.boats) ??
      preparedTemplate.getObjectByName('pCube1') ??
      null;
    boatRef.current = boats;

    const boatPos = new THREE.Vector3();
    if (boats) {
      boats.getWorldPosition(boatPos);
    } else {
      scaledBox.getCenter(boatPos);
      boatPos.y = scaledBox.max.y * 0.3;
    }

    const water = preparedTemplate.getObjectByName(ISLAND_NODES.water);
    const waterY = water
      ? (() => {
          const w = new THREE.Vector3();
          water.getWorldPosition(w);
          return w.y;
        })()
      : scaledBox.min.y + 0.05;

    const scale = preparedTemplate.scale.x;
    const spanX = scaledBox.max.x - scaledBox.min.x;
    const spanZ = scaledBox.max.z - scaledBox.min.z;

    const refs: IslandRefs = {
      boatPosition: [boatPos.x, boatPos.y, boatPos.z],
      boatScale: scale,
      floodPlaneSize: Math.max(spanX, spanZ) * 1.35,
      spawnBounds: {
        minX: scaledBox.min.x + 1,
        maxX: scaledBox.max.x - 1,
        minZ: scaledBox.min.z + 1,
        maxZ: scaledBox.max.z - 1,
        groundY:
          scaledBox.min.y + (scaledBox.max.y - scaledBox.min.y) * 0.22,
        waterY,
        spawnY: scaledBox.max.y + 8,
      },
    };

    if (!refsSetRef.current) {
      refsSetRef.current = true;
      setIslandRefs(refs);
    }
  }, [preparedTemplate, setIslandRefs]);

  useFrame((_, delta) => {
    if (phase === 'won' && boatRef.current) {
      boatRef.current.position.x += delta * 2.5;
      boatRef.current.position.z -= delta * 1.2;
      boatRef.current.position.y += delta * 0.15;
    }
    if (phase === 'lost' && boatRef.current) {
      boatRef.current.rotation.z = Math.sin(Date.now() * 0.003) * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={preparedTemplate} />
      {backgroundIslands.map(({ position, object }, index) => (
        <group key={`bg-island-${index}`} position={position}>
          <primitive object={object} />
        </group>
      ))}
    </group>
  );
};

export const preloadIslandGlb = (): void => {
  useLoader.preload(GLTFLoader, ISLAND_GLB_URL);
};

export const FloodWater = () => {
  const { floodY, floodActive, islandRefs } = useGame();
  const meshRef = useRef<THREE.Mesh>(null);

  if (!floodActive) return null;

  const planeSize = islandRefs?.floodPlaneSize ?? 40;

  return (
    <mesh ref={meshRef} position={[0, floodY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[planeSize, planeSize]} />
      <meshStandardMaterial
        color={COLORS.flood}
        transparent
        opacity={0.82}
        roughness={0.2}
        metalness={0.1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

export const SceneLighting = () => (
  <>
    <color attach="background" args={[COLORS.sky]} />
    <fog attach="fog" args={[COLORS.fog, 55, 120]} />
    <ambientLight intensity={0.72} color={COLORS.ambient} />
    <hemisphereLight
      args={[COLORS.sky, COLORS.ground, 0.9]}
      position={[0, 30, 0]}
    />
    <directionalLight
      position={[8, 20, 10]}
      intensity={1.85}
      color={COLORS.sun}
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-bias={-0.00015}
      shadow-normalBias={0.025}
      shadow-camera-near={0.5}
      shadow-camera-far={55}
      shadow-camera-left={-16}
      shadow-camera-right={16}
      shadow-camera-top={16}
      shadow-camera-bottom={-16}
    />
  </>
);
