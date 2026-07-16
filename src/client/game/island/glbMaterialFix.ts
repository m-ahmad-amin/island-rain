import * as THREE from 'three';
import { ISLAND_NODES } from './islandNodes';

const isUnderGroup = (object: THREE.Object3D, groupName: string): boolean => {
  let current: THREE.Object3D | null = object;
  while (current) {
    if (current.name === groupName) return true;
    current = current.parent;
  }
  return false;
};

const textureSlots = [
  'map',
  'normalMap',
  'roughnessMap',
  'metalnessMap',
  'aoMap',
  'emissiveMap',
  'alphaMap',
] as const;

/** Match Sketchfab-style smooth sampling on GLB textures */
export const enhanceGlbScene = (
  root: THREE.Object3D,
  maxAnisotropy = 16
): void => {
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    const isTree = isUnderGroup(child, ISLAND_NODES.trees);
    child.castShadow = !isTree;
    child.receiveShadow = true;

    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];

    for (const material of materials) {
      if (!(material instanceof THREE.MeshStandardMaterial)) continue;

      for (const slot of textureSlots) {
        const tex = material[slot];
        if (!(tex instanceof THREE.Texture)) continue;

        tex.anisotropy = maxAnisotropy;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = true;
        if (slot === 'map' || slot === 'emissiveMap') {
          tex.colorSpace = THREE.SRGBColorSpace;
        }
        tex.needsUpdate = true;
      }

      material.needsUpdate = true;
    }
  });
};
