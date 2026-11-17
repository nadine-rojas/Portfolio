import { useEffect, useRef } from 'react';
import {
  advanceSpiderLegs,
  computeSurfaceElevation,
  createSpiderLegs,
  solveTwoBoneIK,
  type SurfaceRect,
} from '../utils/spiderKinematics';

/**
 * Fondo / capa procedural fija con "Araña de Tiritas" impulsada por cinemática inversa (IK).
 * Persigue suavemente el cursor, proyecta sombras dinámicas y trepa visualmente
 * sobre las tarjetas neumórficas marcadas con [data-neu-climbable="true"] sin bloquear clics.
 */
export function SpiderOverlay() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // Cachear rectángulos de tarjetas neumórficas fuera del bucle de animación
    let climbRects: SurfaceRect[] = [];
    const refreshClimbRects = () => {
      const nodes = document.querySelectorAll<HTMLElement>('[data-neu-climbable="true"]');
      const next: SurfaceRect[] = [];
      nodes.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom >= -60 && r.top <= height + 60 && r.width > 0 && r.height > 0) {
          next.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
        }
      });
      climbRects = next;
    };
    refreshClimbRects();

    let pointerX = width * 0.62;
    let pointerY = height * 0.42;
    let hasMovedPointer = false;

    const handlePointerMove = (e: PointerEvent) => {
      pointerX = e.clientX;
      pointerY = e.clientY;
      hasMovedPointer = true;
    };

    const handleScrollOrResize = () => {
      refreshClimbRects();
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });

    // Estado físico de la araña
    let bodyX = width * 0.36;
    let bodyY = height * 0.38;
    let velX = 0;
    let velY = 0;
    let bodyAngle = 0;
    const legs = createSpiderLegs(bodyX, bodyY);

    let rafId = 0;
    let lastTime = performance.now();
    let elapsed = 0;
    let rectRefreshAccum = 0;

    const drawStripLimb = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      widthPx: number,
      strokeMain: string,
      strokeGlow: string,
    ) => {
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const nx = -Math.sin(angle) * (widthPx * 0.48);
      const ny = Math.cos(angle) * (widthPx * 0.48);

      // Dos tiritas paralelas estilo exoesqueleto de tiras finas
      ctx.beginPath();
      ctx.moveTo(x1 + nx, y1 + ny);
      ctx.lineTo(x2 + nx * 0.65, y2 + ny * 0.65);
      ctx.moveTo(x1 - nx, y1 - ny);
      ctx.lineTo(x2 - nx * 0.65, y2 - ny * 0.65);
      ctx.strokeStyle = strokeMain;
      ctx.lineWidth = 1.25;
      ctx.stroke();

      // Filamento central luminoso
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = strokeGlow;
      ctx.lineWidth = 0.85;
      ctx.stroke();
    };

    const renderFrame = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      elapsed += dt;
      rectRefreshAccum += dt;
      if (rectRefreshAccum > 0.35) {
        rectRefreshAccum = 0;
        refreshClimbRects();
      }

      ctx.clearRect(0, 0, width, height);

      // Objetivo suave: sigue el puntero o realiza un merodeo orgánico inicial
      const targetX = hasMovedPointer
        ? pointerX
        : width * 0.56 + Math.cos(elapsed * 0.55) * Math.min(180, width * 0.22);
      const targetY = hasMovedPointer
        ? pointerY
        : height * 0.46 + Math.sin(elapsed * 0.72) * Math.min(110, height * 0.16);

      if (!prefersReducedMotion) {
        const dx = targetX - bodyX;
        const dy = targetY - bodyY;
        const dist = Math.hypot(dx, dy);

        // Se detiene respetando un pequeño margen alrededor del cursor para no tapar el puntero
        const followRadius = 38;
        if (dist > followRadius) {
          const pull = Math.min(260, (dist - followRadius) * 2.5);
          const desiredVx = (dx / dist) * pull;
          const desiredVy = (dy / dist) * pull;
          const damp = 1 - Math.exp(-5.5 * dt);
          velX += (desiredVx - velX) * damp;
          velY += (desiredVy - velY) * damp;
        } else {
          const brake = 1 - Math.exp(-8 * dt);
          velX += (0 - velX) * brake;
          velY += (0 - velY) * brake;
        }

        bodyX += velX * dt;
        bodyY += velY * dt;

        const speed = Math.hypot(velX, velY);
        if (speed > 8) {
          const desiredAngle = Math.atan2(velY, velX);
          let diff = desiredAngle - bodyAngle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          bodyAngle += diff * (1 - Math.exp(-9 * dt));
        }

        advanceSpiderLegs(legs, bodyX, bodyY, bodyAngle, velX, velY, dt);
      }

      const bodyElevation = computeSurfaceElevation(bodyX, bodyY, climbRects, 22);
      const breathOffset = prefersReducedMotion ? 0 : Math.sin(elapsed * 3.1) * 1.6;
      const bodyLiftY = bodyElevation * 9 + breathOffset;
      const climbScale = 1 + bodyElevation * 0.085;

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // 1. Sombra dinámica proyectada sobre fondo o tarjetas neumórficas
      const shadowOffsetX = 9 + bodyElevation * 13;
      const shadowOffsetY = 11 + bodyElevation * 15;

      // Sombras de cada pata
      for (let i = 0; i < legs.length; i++) {
        const leg = legs[i];
        const rootAngle = bodyAngle + leg.side * 0.4;
        const rootX = bodyX + Math.cos(rootAngle) * 7;
        const rootY = bodyY + Math.sin(rootAngle) * 7 - bodyLiftY * 0.4;
        const footElev = computeSurfaceElevation(leg.footX, leg.footY, climbRects, 18);
        const footVisualY = leg.footY - leg.stepHeight - footElev * 4;
        const ik = solveTwoBoneIK(
          rootX,
          rootY,
          leg.footX,
          footVisualY,
          leg.femurLength * climbScale,
          leg.tibiaLength * climbScale,
          leg.bendDir,
        );

        const legShadowX = 6 + (footElev + bodyElevation) * 7 + leg.stepHeight * 0.45;
        const legShadowY = 8 + (footElev + bodyElevation) * 8 + leg.stepHeight * 0.55;

        ctx.beginPath();
        ctx.moveTo(rootX + shadowOffsetX * 0.7, rootY + shadowOffsetY * 0.7);
        ctx.lineTo(ik.kneeX + legShadowX, ik.kneeY + legShadowY);
        ctx.lineTo(ik.footX + legShadowX * 0.5, ik.footY + legShadowY * 0.5);
        ctx.strokeStyle = `rgba(4, 5, 8, ${0.34 + bodyElevation * 0.18})`;
        ctx.lineWidth = 3.2;
        ctx.stroke();
      }

      // Sombra del cuerpo
      ctx.beginPath();
      ctx.ellipse(
        bodyX + shadowOffsetX,
        bodyY + shadowOffsetY,
        17 * climbScale,
        12 * climbScale,
        bodyAngle,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = `rgba(4, 5, 8, ${0.42 + bodyElevation * 0.18})`;
      ctx.fill();

      // 2. Renderizar las 8 patas articuladas ("tiritas") con cinemática inversa
      for (let i = 0; i < legs.length; i++) {
        const leg = legs[i];
        const rootAngle = bodyAngle + (leg.side === 1 ? 0.5 : -0.5) + (Math.floor(i / 2) - 1.5) * 0.28;
        const rootX = bodyX + Math.cos(rootAngle) * 8 * climbScale;
        const rootY = bodyY - bodyLiftY + Math.sin(rootAngle) * 8 * climbScale;

        const footElev = computeSurfaceElevation(leg.footX, leg.footY, climbRects, 18);
        const footVisualY = leg.footY - leg.stepHeight - footElev * 4;

        const ik = solveTwoBoneIK(
          rootX,
          rootY,
          leg.footX,
          footVisualY,
          leg.femurLength * climbScale,
          leg.tibiaLength * climbScale,
          leg.bendDir,
        );

        const isClimbing = footElev > 0 || bodyElevation > 0;
        const femurColor = isClimbing
          ? 'rgba(52, 211, 153, 0.72)'
          : 'rgba(52, 211, 153, 0.48)';
        const tibiaColor = isClimbing
          ? 'rgba(34, 211, 238, 0.72)'
          : 'rgba(34, 211, 238, 0.45)';
        const filamentColor = isClimbing
          ? 'rgba(167, 243, 208, 0.6)'
          : 'rgba(110, 231, 183, 0.35)';

        // Fémur (tiritas dobles)
        drawStripLimb(rootX, rootY, ik.kneeX, ik.kneeY, 3.8 * climbScale, femurColor, filamentColor);
        // Tibia (tiritas afiladas hacia la punta)
        drawStripLimb(ik.kneeX, ik.kneeY, ik.footX, ik.footY, 2.2 * climbScale, tibiaColor, filamentColor);

        // Articulación de rodilla luminosa
        ctx.beginPath();
        ctx.arc(ik.kneeX, ik.kneeY, 2.3 * climbScale, 0, Math.PI * 2);
        ctx.fillStyle = isClimbing ? 'rgba(52, 211, 153, 0.92)' : 'rgba(52, 211, 153, 0.65)';
        ctx.fill();

        // Punta de apoyo sobre la superficie
        ctx.beginPath();
        ctx.arc(ik.footX, ik.footY, 1.8 * climbScale, 0, Math.PI * 2);
        ctx.fillStyle =
          leg.stepProgress < 1
            ? 'rgba(250, 204, 21, 0.85)'
            : isClimbing
              ? 'rgba(34, 211, 238, 0.9)'
              : 'rgba(34, 211, 238, 0.55)';
        ctx.fill();
      }

      // 3. Cuerpo articulado en segmentos wireframe translúcidos ("araña de tiritas")
      const drawBodyX = bodyX;
      const drawBodyY = bodyY - bodyLiftY;

      ctx.save();
      ctx.translate(drawBodyX, drawBodyY);
      ctx.rotate(bodyAngle);
      ctx.scale(climbScale, climbScale);

      // Abdomen trasero segmentado con costillas de tiritas
      const abdX = -15;
      ctx.beginPath();
      ctx.ellipse(abdX, 0, 12.5, 9, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(22, 24, 29, 0.68)';
      ctx.fill();
      ctx.strokeStyle = bodyElevation > 0 ? 'rgba(52, 211, 153, 0.85)' : 'rgba(52, 211, 153, 0.55)';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Anillos internos del abdomen
      for (const offset of [-5, 0, 5]) {
        ctx.beginPath();
        ctx.ellipse(abdX + offset, 0, 2.6, 6.2 - Math.abs(offset) * 0.45, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Cefalotórax
      ctx.beginPath();
      ctx.ellipse(3, 0, 8.5, 6.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(22, 24, 29, 0.78)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.8)';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Quelíceros / ojos frontales sutiles
      ctx.beginPath();
      ctx.arc(8.5, -2.4, 1.35, 0, Math.PI * 2);
      ctx.arc(8.5, 2.4, 1.35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(34, 211, 238, 0.9)';
      ctx.fill();

      ctx.restore();
      ctx.restore();

      if (!prefersReducedMotion) {
        rafId = requestAnimationFrame(renderFrame);
      }
    };

    rafId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', resize);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-testid="spider-ik-canvas"
      aria-hidden="true"
      className="fixed inset-0 z-30 pointer-events-none"
    />
  );
}
