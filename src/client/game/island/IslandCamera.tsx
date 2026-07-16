import { useEffect, useMemo, useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { useGame } from './GameContext';
import {
  CAMERA_INTRO_DURATION_SEC,
  easeInOutCubic,
  getCameraHome,
  getCameraIntroStart,
  getOrbitMinDistance,
} from './cameraConstants';

export const IslandCamera = () => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const { registerCameraReset, cameraIntroActive, completeCameraIntro } = useGame();

  const cameraHome = useMemo(() => getCameraHome(), []);
  const introStart = useMemo(() => getCameraIntroStart(), []);
  const minDistance = useMemo(() => getOrbitMinDistance(), []);

  const introProgressRef = useRef(0);
  const introFinishedRef = useRef(false);

  useEffect(() => {
    registerCameraReset(() => {
      camera.position.copy(cameraHome.position);
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
        controlsRef.current.target.copy(cameraHome.target);
        controlsRef.current.update();
      }
    });
  }, [camera, cameraHome, registerCameraReset]);

  useEffect(() => {
    if (cameraIntroActive) {
      introProgressRef.current = 0;
      introFinishedRef.current = false;
      camera.position.copy(introStart);
      if (controlsRef.current) {
        controlsRef.current.enabled = false;
        controlsRef.current.target.copy(cameraHome.target);
        controlsRef.current.update();
      }
    }
  }, [camera, cameraHome.target, cameraIntroActive, introStart]);

  useFrame((_, delta) => {
    if (!cameraIntroActive || introFinishedRef.current) return;

    introProgressRef.current = Math.min(
      1,
      introProgressRef.current + delta / CAMERA_INTRO_DURATION_SEC
    );
    const t = easeInOutCubic(introProgressRef.current);

    camera.position.lerpVectors(introStart, cameraHome.position, t);

    if (controlsRef.current) {
      controlsRef.current.target.copy(cameraHome.target);
      controlsRef.current.update();
    }

    if (introProgressRef.current >= 1) {
      introFinishedRef.current = true;
      camera.position.copy(cameraHome.position);
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
        controlsRef.current.target.copy(cameraHome.target);
        controlsRef.current.update();
      }
      completeCameraIntro();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableZoom
      enablePan
      enableRotate
      enableDamping
      dampingFactor={0.06}
      rotateSpeed={0.65}
      zoomSpeed={0.85}
      panSpeed={0.75}
      screenSpacePanning
      minDistance={minDistance}
      maxDistance={32}
      maxPolarAngle={Math.PI / 2.15}
      minPolarAngle={0.35}
      target={cameraHome.target}
      touches={{
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN,
      }}
    />
  );
};
