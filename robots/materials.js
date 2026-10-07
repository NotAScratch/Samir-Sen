/* Shared robot materials. Every colour comes from the CSS tokens, so the
   cast stays matte white and graphite on the page without hex values here. */
import * as THREE from 'three';
import { readTokens } from './tokens.js';

export { readTokens };

export function createMaterials(tokens) {
  const joint = new THREE.Color(tokens.joint);
  return {
    shell: new THREE.MeshPhysicalMaterial({
      color: tokens.shell, roughness: 0.42, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.45,
    }),
    joint: new THREE.MeshStandardMaterial({ color: joint, roughness: 0.45, metalness: 0.65 }),
    visor: new THREE.MeshPhysicalMaterial({
      color: joint.clone().multiplyScalar(0.2), roughness: 0.06, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05,
    }),
    rubber: new THREE.MeshStandardMaterial({ color: joint, roughness: 0.92, metalness: 0 }),
    signal: new THREE.MeshStandardMaterial({
      color: tokens.accent, emissive: tokens.accent, emissiveIntensity: 2.2,
    }),
  };
}
