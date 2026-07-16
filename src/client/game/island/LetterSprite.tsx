import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { COLORS } from './islandNodes';

const textureCache = new Map<string, THREE.CanvasTexture>();

export const getLetterTexture = (
  letter: string,
  variant: 'normal' | 'decoy' | 'boat' | 'rain' | 'charm' = 'normal'
): THREE.CanvasTexture => {
  const key = `${letter.toUpperCase()}-${variant}`;
  const cached = textureCache.get(key);
  if (cached) return cached;

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    const fallback = new THREE.CanvasTexture(canvas);
    textureCache.set(key, fallback);
    return fallback;
  }

  if (variant === 'charm') {
    const pad = 8;
    const radius = 22;

    const bgGrad = ctx.createLinearGradient(0, 0, 0, size);
    bgGrad.addColorStop(0, '#2eb8e8');
    bgGrad.addColorStop(1, '#0d5f8f');
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.roundRect(pad, pad, size - pad * 2, size - pad * 2, radius);
    ctx.fill();

    ctx.strokeStyle = '#f5c842';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(38, 36, 18, 12, -0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = 'bold 76px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#0a2540';
    ctx.lineWidth = 7;
    ctx.strokeText(letter.toUpperCase(), size / 2, size / 2 + 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(letter.toUpperCase(), size / 2, size / 2 + 2);
  } else {
    const bg =
      variant === 'decoy'
        ? '#4a2020'
        : variant === 'boat'
          ? '#3d2817'
          : variant === 'rain'
            ? '#166534'
            : COLORS.letter;
    const fg =
      variant === 'decoy'
        ? COLORS.letterDecoy
        : variant === 'boat'
          ? '#f5e6c8'
          : variant === 'rain'
            ? '#ecfdf5'
            : COLORS.letterOutline;

    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(10, 10, size - 20, size - 20, 18);
    ctx.fill();

    ctx.strokeStyle =
      variant === 'decoy'
        ? '#ff8a80'
        : variant === 'rain'
          ? '#86efac'
          : '#6a9ab8';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = fg;
    ctx.font = 'bold 64px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter.toUpperCase(), size / 2, size / 2 + 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
};

type LetterSpriteProps = {
  letter: string;
  variant?: 'normal' | 'decoy' | 'boat' | 'rain' | 'charm';
  scale?: number;
};

export const LetterSprite = ({
  letter,
  variant = 'normal',
  scale = 0.75,
}: LetterSpriteProps) => {
  const texture = useMemo(
    () => getLetterTexture(letter, variant),
    [letter, variant]
  );

  return (
    <mesh scale={scale}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

type LetterRainCharmProps = {
  letter: string;
  size?: number;
};

/** Glowing rain-charm tile — letter always faces the camera */
export const LetterRainCharm = ({
  letter,
  size = 0.72,
}: LetterRainCharmProps) => {
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!glowRef.current) return;
    const mat = glowRef.current.material;
    if (!(mat instanceof THREE.MeshBasicMaterial)) return;
    mat.opacity = 0.28 + Math.sin(clock.elapsedTime * 3.2) * 0.1;
  });

  return (
    <Billboard follow lockX lockY lockZ>
      <group scale={size}>
        <mesh ref={glowRef} position={[0, 0, -0.06]} renderOrder={-1}>
          <circleGeometry args={[0.72, 32]} />
          <meshBasicMaterial
            color="#4fd1f9"
            transparent
            opacity={0.35}
            depthWrite={false}
          />
        </mesh>

        <mesh position={[0, -0.52, -0.04]} scale={[0.22, 0.32, 0.22]}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshStandardMaterial
            color="#7dd3fc"
            emissive="#0284c7"
            emissiveIntensity={0.45}
            roughness={0.15}
            metalness={0.1}
            transparent
            opacity={0.88}
          />
        </mesh>

        <LetterSprite letter={letter} variant="charm" scale={0.95} />
      </group>
    </Billboard>
  );
};

/** Boat win display — keeps wooden tile style */
export const LetterBlock = ({ size = 0.42 }: { size?: number }) => (
  <mesh castShadow receiveShadow scale={size}>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color="#c9a55c" roughness={0.7} />
  </mesh>
);
