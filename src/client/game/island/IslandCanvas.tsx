import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { IslandScene3D } from './IslandScene3D';
import { preloadIslandGlb } from './IslandEnvironment';

export const IslandCanvas = () => {
  useEffect(() => {
    preloadIslandGlb();
  }, []);

  return (
    <Canvas
      shadows
      dpr={Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2)}
      camera={{ position: [9, 6.5, 11], fov: 45, near: 0.1, far: 120 }}
      className="touch-none"
      style={{ touchAction: 'none' }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
    >
    <Suspense
      fallback={
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#1a2744" wireframe />
        </mesh>
      }
    >
      <IslandScene3D />
    </Suspense>
    </Canvas>
  );
};
