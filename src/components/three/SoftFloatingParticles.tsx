import { type RefObject, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { ChessFinishKind } from '../../three/chessScene';
import {
  PARTICLE_PALETTES,
  createSoftParticleSeeds,
  evaluateParticleState,
} from '../../utils/floatingParticles';

interface SoftFloatingParticlesProps {
  finish: ChessFinishKind;
  enabled: boolean;
  pointerTargetRef: RefObject<{ x: number; y: number }>;
  prefersReducedMotion: boolean;
}

const VERTEX_SHADER = `
  attribute float aSize;
  attribute float aAlpha;
  attribute float aSoftness;
  attribute vec3 aColor;

  uniform float uPixelRatio;
  uniform float uOpacity;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vSoftness;

  void main() {
    vColor = aColor;
    vAlpha = aAlpha * uOpacity;
    vSoftness = aSoftness;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = clamp(aSize * uPixelRatio * (320.0 / max(-mvPosition.z, 0.85)), 3.0, 96.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vSoftness;

  void main() {
    if (vAlpha <= 0.004) discard;

    vec2 centered = gl_PointCoord - vec2(0.5);
    float dist = length(centered) * 2.0;
    if (dist > 1.0) discard;

    float core = exp(-dist * dist * mix(5.4, 2.5, vSoftness));
    float halo = smoothstep(1.0, 0.0, dist);
    float radialGlow = mix(core, halo * halo, vSoftness * 0.58);

    gl_FragColor = vec4(vColor, radialGlow * vAlpha);
  }
`;

const _tmpColor = new THREE.Color();

/**
 * Sistema de partículas suaves en React Three Fiber usando <points> y ShaderMaterial
 * con dos capas atmosféricas (motas orbitales cercanas y bokeh ambiental difuso).
 */
export function SoftFloatingParticles({
  finish,
  enabled,
  pointerTargetRef,
  prefersReducedMotion,
}: SoftFloatingParticlesProps) {
  const { gl } = useThree();
  const pointsRef = useRef<THREE.Points>(null);
  const elapsedRef = useRef(0);
  const smoothPointerRef = useRef({ x: 0, y: 0 });
  const opacityRef = useRef(enabled ? 1 : 0);

  const seeds = useMemo(() => createSoftParticleSeeds(96, 44, 202611), []);
  const count = seeds.length;

  const { geometry, positions, alphas, sizes, colors } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const posArr = new Float32Array(count * 3);
    const alphaArr = new Float32Array(count);
    const sizeArr = new Float32Array(count);
    const softnessArr = new Float32Array(count);
    const colorArr = new Float32Array(count * 3);

    const initialPalette = PARTICLE_PALETTES[finish];
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      const state = evaluateParticleState(s, 0, 0, 0, prefersReducedMotion);
      posArr[i * 3] = state.x;
      posArr[i * 3 + 1] = state.y;
      posArr[i * 3 + 2] = state.z;
      alphaArr[i] = state.alpha;
      sizeArr[i] = state.scale;
      softnessArr[i] = s.layer === 'outer' ? 0.85 : 0.25;

      _tmpColor.set(initialPalette[s.colorIndex]);
      colorArr[i * 3] = _tmpColor.r;
      colorArr[i * 3 + 1] = _tmpColor.g;
      colorArr[i * 3 + 2] = _tmpColor.b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(alphaArr, 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizeArr, 1));
    geo.setAttribute('aSoftness', new THREE.BufferAttribute(softnessArr, 1));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colorArr, 3));
    geo.computeBoundingSphere();

    return {
      geometry: geo,
      positions: posArr,
      alphas: alphaArr,
      sizes: sizeArr,
      colors: colorArr,
    };
  }, [count, seeds, prefersReducedMotion]);

  const shaderMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uPixelRatio: { value: gl.getPixelRatio() },
          uOpacity: { value: enabled ? 1 : 0 },
        },
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [gl],
  );

  // Sincroniza paleta cromática con el acabado activo de la pieza
  useEffect(() => {
    const palette = PARTICLE_PALETTES[finish];
    for (let i = 0; i < count; i++) {
      _tmpColor.set(palette[seeds[i].colorIndex]);
      colors[i * 3] = _tmpColor.r;
      colors[i * 3 + 1] = _tmpColor.g;
      colors[i * 3 + 2] = _tmpColor.b;
    }
    const colorAttr = geometry.getAttribute('aColor') as THREE.BufferAttribute;
    colorAttr.needsUpdate = true;
  }, [finish, count, seeds, colors, geometry]);

  // Libera recursos GPU al desmontar
  useEffect(() => {
    return () => {
      geometry.dispose();
      shaderMaterial.dispose();
    };
  }, [geometry, shaderMaterial]);

  useFrame((_state, delta) => {
    const dt = Math.min(delta, 0.08);
    elapsedRef.current += dt;

    const targetOpacity = enabled ? 1 : 0;
    opacityRef.current = THREE.MathUtils.damp(opacityRef.current, targetOpacity, 10, dt);
    if (!enabled && opacityRef.current < 0.02) opacityRef.current = 0;
    shaderMaterial.uniforms.uOpacity.value = opacityRef.current;
    shaderMaterial.uniforms.uPixelRatio.value = gl.getPixelRatio();

    if (opacityRef.current <= 0.004) return;

    const ptr = pointerTargetRef.current;
    smoothPointerRef.current.x = THREE.MathUtils.damp(
      smoothPointerRef.current.x,
      ptr.x,
      3.5,
      dt,
    );
    smoothPointerRef.current.y = THREE.MathUtils.damp(
      smoothPointerRef.current.y,
      ptr.y,
      3.5,
      dt,
    );

    const elapsed = elapsedRef.current;
    for (let i = 0; i < count; i++) {
      const evaluated = evaluateParticleState(
        seeds[i],
        elapsed,
        smoothPointerRef.current.x,
        smoothPointerRef.current.y,
        prefersReducedMotion,
      );
      positions[i * 3] = evaluated.x;
      positions[i * 3 + 1] = evaluated.y;
      positions[i * 3 + 2] = evaluated.z;
      alphas[i] = evaluated.alpha;
      sizes[i] = evaluated.scale;
    }

    (geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (geometry.getAttribute('aAlpha') as THREE.BufferAttribute).needsUpdate = true;
    (geometry.getAttribute('aSize') as THREE.BufferAttribute).needsUpdate = true;
  });

  return (
    <points
      ref={pointsRef}
      name="soft-floating-particles"
      geometry={geometry}
      material={shaderMaterial}
      frustumCulled={false}
    />
  );
}
