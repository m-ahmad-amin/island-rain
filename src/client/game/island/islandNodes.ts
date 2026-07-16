/**
 * GLB node names — low_poly_island_environment.glb (Sketchfab / Umar)
 * Inspect via: gltf.scene.traverse(n => console.log(n.name))
 *
 * Boats      — parent group for escape boats (letter placement target)
 * pCube1–5   — individual boat hull meshes under Boats
 * water1     — baked water plane in the model (decorative; flood uses separate mesh)
 * Ground2    — main island terrain / beach
 * Road1      — path mesh
 * Trees      — vegetation group
 *
 * CSP note: load GLB with three's GLTFLoader only — do not use drei's useGLTF
 * defaults (Draco/meshopt decoders spawn blob: Web Workers blocked by Devvit).
 */
export const ISLAND_NODES = {
  boats: 'Boats',
  boatMeshes: ['pCube1', 'pCube2', 'pCube3', 'pCube4', 'pCube5'] as const,
  water: 'water1',
  ground: 'Ground2',
  road: 'Road1',
  trees: 'Trees',
  root: 'RootNode',
} as const;

export const ISLAND_GLB_URL = new URL(
  '../assets/low_poly_island_environment.glb',
  import.meta.url
).href;

/** Bright tropical palette — matches the GLB's original look */
export const COLORS = {
  fog: '#9fd4f0',
  ambient: '#ffffff',
  ground: '#5cb85c',
  sky: '#87ceeb',
  sun: '#fff4d6',
  flood: '#1a7a8c',
  letter: '#f0f8ff',
  letterDecoy: '#ff8a80',
  letterOutline: '#2c1810',
} as const;
