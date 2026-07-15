import * as THREE from 'three';

const CAMERA_TARGET = new THREE.Vector3(0, 1.2, 0);
const CAMERA_OFFSET = new THREE.Vector3(11, 8, 14).sub(CAMERA_TARGET);

/** Slightly closer on desktop (pointer + min width). */
export const DESKTOP_CAMERA_ZOOM = 0.84;

export const isDesktopView = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(min-width: 768px) and (pointer: fine)').matches;

export const getCameraHome = (): { position: THREE.Vector3; target: THREE.Vector3 } => {
  const zoom = isDesktopView() ? DESKTOP_CAMERA_ZOOM : 1;
  const position = CAMERA_TARGET.clone().add(CAMERA_OFFSET.clone().multiplyScalar(zoom));
  return { position, target: CAMERA_TARGET.clone() };
};

/** @deprecated Use getCameraHome() — kept for reference */
export const CAMERA_HOME = {
  position: CAMERA_TARGET.clone().add(CAMERA_OFFSET),
  target: CAMERA_TARGET.clone(),
};

/** Far elevated angle — intro swoops down into play view. */
export const getCameraIntroStart = (): THREE.Vector3 => {
  const home = getCameraHome();
  const distance = isDesktopView() ? 52 : 56;
  const elevated = new THREE.Vector3(-0.55, 0.85, 0.25).normalize();
  return home.target.clone().add(elevated.multiplyScalar(distance));
};

export const CAMERA_INTRO_DURATION_SEC = 2.8;

export const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const getOrbitMinDistance = (): number => (isDesktopView() ? 3.2 : 4);
