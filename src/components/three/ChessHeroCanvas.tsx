import { type RefObject, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  type ChessFinishKind,
  type ChessPieceKind,
  applyChessFinishMaterial,
  buildKingGroup,
  buildKnightGroup,
  createChessboardTexture,
  createMicroGrainTexture,
  createRadialShadowTexture,
  detectSoftwareWebGL,
} from '../../three/chessScene';
import { SoftFloatingParticles } from './SoftFloatingParticles';

interface ChessHeroCanvasProps {
  piece: ChessPieceKind;
  finish: ChessFinishKind;
  autoRotate: boolean;
  particlesEnabled: boolean;
  resetSignal: number;
  onWebGLFallback: () => void;
}

const DEFAULT_CAMERA_POS = new THREE.Vector3(3.75, 3.35, 5.75);

/**
 * Configura PMREM RoomEnvironment procedural y atributos de accesibilidad sobre el renderer.
 */
function StudioEnvironmentRig() {
  const { gl, scene } = useThree();

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmrem.dispose();

    return () => {
      if (scene.environment === envTex) {
        scene.environment = null;
      }
      envTex.dispose();
    };
  }, [gl, scene]);

  return null;
}

/**
 * Maneja OrbitControls, offset de cámara en escritorio y reseteo suave de vista.
 */
function CameraAndControlsRig({
  resetSignal,
  isSoftwareGl,
}: {
  resetSignal: number;
  isSoftwareGl: boolean;
}) {
  const { camera, gl, size, invalidate } = useThree();
  const controlsRef = useRef<OrbitControls | null>(null);
  const lastSizeRef = useRef({ w: 0, h: 0 });

  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minPolarAngle = Math.PI * 0.2;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.target.set(0, 0.35, 0);
    controls.update();
    controlsRef.current = controls;

    const handleChange = () => invalidate();
    controls.addEventListener('change', handleChange);

    return () => {
      controls.removeEventListener('change', handleChange);
      controls.dispose();
      controlsRef.current = null;
    };
  }, [camera, gl, isSoftwareGl, invalidate]);

  useEffect(() => {
    const w = Math.max(size.width, 320);
    const h = Math.max(size.height, 320);
    if (lastSizeRef.current.w === w && lastSizeRef.current.h === h) return;
    lastSizeRef.current = { w, h };

    const persp = camera as THREE.PerspectiveCamera;
    persp.aspect = w / h;
    if (w >= 1024) {
      persp.setViewOffset(w, h, -w * 0.21, -h * 0.02, w, h);
    } else {
      persp.clearViewOffset();
    }
    persp.updateProjectionMatrix();
    invalidate();
  }, [camera, size.width, size.height, invalidate]);

  useEffect(() => {
    if (resetSignal === 0) return;
    camera.position.copy(DEFAULT_CAMERA_POS);
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0.35, 0);
      controlsRef.current.update();
    }
    invalidate();
  }, [resetSignal, camera, invalidate]);

  useFrame(() => {
    controlsRef.current?.update();
  });

  return null;
}

/**
 * Ritma el render bajo SwiftShader / WebGL por software con fenceSync + pausa de 80 ms
 * para no saturar el hilo principal en entornos sin GPU dedicada.
 */
function SoftwareGlPacer({
  active,
  triggerDeps,
}: {
  active: boolean;
  triggerDeps: readonly unknown[];
}) {
  const { gl, invalidate } = useThree();

  useEffect(() => {
    if (!active) return;
    let disposed = false;
    let timerId = 0;

    const scheduleNext = () => {
      if (disposed) return;
      const context = gl.getContext() as WebGL2RenderingContext | null;
      if (!context || typeof context.fenceSync !== 'function') {
        timerId = window.setTimeout(() => {
          if (!disposed) {
            invalidate();
            scheduleNext();
          }
        }, 80);
        return;
      }

      const sync = context.fenceSync(context.SYNC_GPU_COMMANDS_COMPLETE, 0);
      context.flush();

      const poll = () => {
        if (disposed) {
          if (sync) context.deleteSync(sync);
          return;
        }
        const state = sync && context.getSyncParameter(sync, context.SYNC_STATUS);
        if (state === context.UNSIGNALED) {
          timerId = window.setTimeout(poll, 5);
        } else {
          if (sync) context.deleteSync(sync);
          timerId = window.setTimeout(() => {
            if (!disposed) {
              invalidate();
              scheduleNext();
            }
          }, 80);
        }
      };
      timerId = window.setTimeout(poll, 5);
    };

    invalidate();
    scheduleNext();

    return () => {
      disposed = true;
      window.clearTimeout(timerId);
    };
  }, [active, gl, invalidate]);

  useEffect(() => {
    if (active) invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, triggerDeps);

  return null;
}

interface ChessStageProps {
  piece: ChessPieceKind;
  finish: ChessFinishKind;
  autoRotate: boolean;
  particlesEnabled: boolean;
  pointerTargetRef: RefObject<{ x: number; y: number }>;
  prefersReducedMotion: boolean;
  isSoftwareGl: boolean;
}

/**
 * Escenario principal con tablero, pieza procedural (Caballo o Rey), sombra de contacto
 * y sistema de partículas suaves flotando alrededor de la pieza.
 */
function ChessStage({
  piece,
  finish,
  autoRotate,
  particlesEnabled,
  pointerTargetRef,
  prefersReducedMotion,
  isSoftwareGl,
}: ChessStageProps) {
  const { gl, invalidate } = useThree();
  const piecePivotRef = useRef<THREE.Group>(null);
  const contactShadowRef = useRef<THREE.Mesh>(null);
  const spinAngleRef = useRef(0);
  const elapsedRef = useRef(0);
  const smoothParallaxRef = useRef({ x: 0, y: 0 });

  const resources = useMemo(() => {
    const maxAniso = gl.capabilities.getMaxAnisotropy();
    const grainBump = createMicroGrainTexture();
    const boardTex = createChessboardTexture(maxAniso);
    const shadowTex = createRadialShadowTexture();

    const primaryMat = new THREE.MeshPhysicalMaterial({
      color: 0x283044,
      roughness: 0.28,
      metalness: 0.45,
      clearcoat: 0.72,
      clearcoatRoughness: 0.22,
      bumpMap: grainBump,
      bumpScale: 0.012,
    });

    const accentMat = new THREE.MeshPhysicalMaterial({
      color: 0xfacc15,
      roughness: 0.14,
      metalness: 0.94,
      clearcoat: 0.4,
      clearcoatRoughness: 0.15,
    });

    const trimMat = new THREE.MeshPhysicalMaterial({
      color: 0x10b981,
      emissive: new THREE.Color(0x059669),
      emissiveIntensity: 0.85,
      roughness: 0.18,
      metalness: 0.72,
    });

    const knightGroup = buildKnightGroup(primaryMat, accentMat, trimMat);
    const kingGroup = buildKingGroup(primaryMat, accentMat, trimMat);

    return {
      grainBump,
      boardTex,
      shadowTex,
      primaryMat,
      accentMat,
      trimMat,
      knightGroup,
      kingGroup,
    };
  }, [gl]);

  useEffect(() => {
    applyChessFinishMaterial(
      finish,
      resources.primaryMat,
      resources.accentMat,
      resources.trimMat,
      isSoftwareGl,
    );
    invalidate();
  }, [finish, resources, isSoftwareGl, invalidate]);

  useEffect(() => {
    resources.knightGroup.visible = piece === 'knight';
    resources.kingGroup.visible = piece === 'king';
    invalidate();
  }, [piece, resources, invalidate]);

  useEffect(() => {
    return () => {
      const disposeGroup = (group: THREE.Group) => {
        group.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            (obj as THREE.Mesh).geometry?.dispose();
          }
        });
      };
      disposeGroup(resources.knightGroup);
      disposeGroup(resources.kingGroup);
      resources.primaryMat.dispose();
      resources.accentMat.dispose();
      resources.trimMat.dispose();
      resources.grainBump.dispose();
      resources.boardTex.dispose();
      resources.shadowTex.dispose();
    };
  }, [resources]);

  useFrame((_state, delta) => {
    const dt = Math.min(delta, 0.1);
    elapsedRef.current += dt;

    if (autoRotate && !prefersReducedMotion) {
      spinAngleRef.current += dt * 0.42;
    }

    const ptr = pointerTargetRef.current;
    smoothParallaxRef.current.x = THREE.MathUtils.damp(
      smoothParallaxRef.current.x,
      ptr.x * 0.18,
      4.5,
      dt,
    );
    smoothParallaxRef.current.y = THREE.MathUtils.damp(
      smoothParallaxRef.current.y,
      ptr.y * 0.1,
      4.5,
      dt,
    );

    const floatY = prefersReducedMotion
      ? 0.12
      : 0.14 + Math.sin(elapsedRef.current * 1.45) * 0.08;

    if (piecePivotRef.current) {
      piecePivotRef.current.position.y = floatY;
      piecePivotRef.current.rotation.y =
        spinAngleRef.current + smoothParallaxRef.current.x * 0.7;
      piecePivotRef.current.rotation.x = smoothParallaxRef.current.y * 0.45;
      piecePivotRef.current.rotation.z = -smoothParallaxRef.current.x * 0.25;
    }

    if (contactShadowRef.current) {
      const shadowScale = 1 - (floatY - 0.14) * 0.6;
      contactShadowRef.current.scale.setScalar(shadowScale);
    }
  });

  return (
    <group position={[0, -0.9, 0]}>
      {/* Pedestal del tablero */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <boxGeometry args={[4.4, 0.16, 4.4]} />
        <meshStandardMaterial color="#16181d" roughness={0.45} metalness={0.4} />
      </mesh>

      {/* Superficie de ajedrez procedural */}
      <mesh position={[0, -0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4.2, 4.2]} />
        <meshStandardMaterial
          map={resources.boardTex}
          roughness={0.42}
          metalness={0.22}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>

      {/* Cuadrícula wireframe sutil */}
      <gridHelper
        args={[12, 16, 0x10b981, 0x252834]}
        position={[0, -0.22, 0]}
        onUpdate={(self) => {
          const mats = Array.isArray(self.material) ? self.material : [self.material];
          mats.forEach((m) => {
            m.transparent = true;
            m.opacity = 0.24;
          });
        }}
      />

      {/* Sombra radial de contacto */}
      <mesh
        ref={contactShadowRef}
        position={[0, 0.012, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[1.18, 32]} />
        <meshBasicMaterial
          map={resources.shadowTex}
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      </mesh>

      {/* Pivote animado de las piezas de ajedrez */}
      <group ref={piecePivotRef}>
        <primitive object={resources.knightGroup} />
        <primitive object={resources.kingGroup} />
      </group>

      {/* Sistema de partículas suaves flotando alrededor de la pieza */}
      <SoftFloatingParticles
        finish={finish}
        enabled={particlesEnabled}
        pointerTargetRef={pointerTargetRef}
        prefersReducedMotion={prefersReducedMotion}
      />
    </group>
  );
}

export function ChessHeroCanvas({
  piece,
  finish,
  autoRotate,
  particlesEnabled,
  resetSignal,
  onWebGLFallback,
}: ChessHeroCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pointerTargetRef = useRef({ x: 0, y: 0 });
  const isSoftwareGl = useMemo(() => detectSoftwareWebGL(), []);
  const prefersReducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      pointerTargetRef.current.x = THREE.MathUtils.clamp(nx, -1, 1);
      pointerTargetRef.current.y = THREE.MathUtils.clamp(ny, -1, 1);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  return (
    <div
      ref={containerRef}
      data-testid="hero-3d-canvas"
      data-cursor="orbit"
      data-piece={piece}
      data-finish={finish}
      data-particles={particlesEnabled ? 'on' : 'off'}
      className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing"
    >
      <Canvas
        shadows={!isSoftwareGl}
        dpr={isSoftwareGl ? 1 : [1, 2]}
        frameloop={isSoftwareGl ? 'demand' : 'always'}
        camera={{
          fov: 40,
          near: 0.1,
          far: 60,
          position: [DEFAULT_CAMERA_POS.x, DEFAULT_CAMERA_POS.y, DEFAULT_CAMERA_POS.z],
        }}
        gl={{
          antialias: !isSoftwareGl,
          powerPreference: 'high-performance',
          alpha: false,
        }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.15;
          gl.domElement.setAttribute(
            'aria-label',
            'Escena 3D interactiva de pieza de ajedrez con partículas suaves',
          );
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            onWebGLFallback();
          });
        }}
      >
        <color attach="background" args={['#16181d']} />
        <fogExp2 attach="fog" args={['#16181d', 0.042]} />

        <StudioEnvironmentRig />

        {/* Iluminación de estudio: Hemisferio frío + Key cálida + Rim esmeralda + Acento cian */}
        <hemisphereLight args={[0xbfe0ff, 0x10131e, 0.95]} />
        <directionalLight
          color={0xfff4de}
          intensity={2.75}
          position={[4.5, 7.5, 4.5]}
          castShadow={!isSoftwareGl}
          shadow-mapSize={[1024, 1024]}
          shadow-camera-near={1}
          shadow-camera-far={20}
          shadow-camera-left={-4}
          shadow-camera-right={4}
          shadow-camera-top={4}
          shadow-camera-bottom={-4}
          shadow-bias={-0.0005}
          shadow-normalBias={0.02}
        />
        <directionalLight color={0x34d399} intensity={1.85} position={[-4.5, 3.5, -4.0]} />
        <pointLight color={0x22d3ee} intensity={2.8} distance={14} decay={2} position={[2.5, 2.2, 2.6]} />

        <CameraAndControlsRig resetSignal={resetSignal} isSoftwareGl={isSoftwareGl} />

        <ChessStage
          piece={piece}
          finish={finish}
          autoRotate={autoRotate}
          particlesEnabled={particlesEnabled}
          pointerTargetRef={pointerTargetRef}
          prefersReducedMotion={prefersReducedMotion}
          isSoftwareGl={isSoftwareGl}
        />

        <SoftwareGlPacer
          active={isSoftwareGl}
          triggerDeps={[piece, finish, particlesEnabled, resetSignal]}
        />
      </Canvas>
    </div>
  );
}
