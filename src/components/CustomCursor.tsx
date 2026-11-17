import { useEffect, useRef, useState } from 'react';

type CursorMode = 'default' | 'interactive' | 'orbit';

/**
 * Cursor personalizado suave para dispositivos de escritorio con puntero fino.
 * Cambia de tamaño y forma al pasar sobre elementos clicables o el lienzo 3D.
 */
export function CustomCursor() {
  const ringRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<CursorMode>('default');
  const [pressed, setPressed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!isFinePointer || prefersReduced) return;

    setEnabled(true);
    document.documentElement.classList.add('has-custom-cursor');

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let ringX = targetX;
    let ringY = targetY;
    let dotX = targetX;
    let dotY = targetY;
    let activeMode: CursorMode = 'default';
    let rafId = 0;
    let lastTime = performance.now();

    const detectMode = (el: EventTarget | null): CursorMode => {
      if (!(el instanceof Element)) return 'default';
      if (el.closest('a, button, input, textarea, select, [role="tab"], [role="button"]')) {
        return 'interactive';
      }
      if (el.closest('[data-cursor="orbit"]')) {
        return 'orbit';
      }
      return 'default';
    };

    const handlePointerMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      setVisible(true);

      const nextMode = detectMode(e.target);
      if (nextMode !== activeMode) {
        activeMode = nextMode;
        setMode(nextMode);
      }
    };

    const handlePointerDown = () => setPressed(true);
    const handlePointerUp = () => setPressed(false);
    const handleMouseLeave = () => setVisible(false);

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const ringLerp = 1 - Math.exp(-16 * dt);
      const dotLerp = 1 - Math.exp(-34 * dt);

      ringX += (targetX - ringX) * ringLerp;
      ringY += (targetY - ringY) * ringLerp;
      dotX += (targetX - dotX) * dotLerp;
      dotY += (targetY - dotY) * dotLerp;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dotX}px, ${dotY}px, 0)`;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      document.documentElement.classList.remove('has-custom-cursor');
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  if (!enabled) return null;

  const sizeClass =
    mode === 'orbit'
      ? 'w-11 h-11 rounded-xl rotate-45 border-cyan-400/80 bg-cyan-400/5'
      : mode === 'interactive'
        ? 'w-10 h-10 rounded-full border-emerald-400/85 bg-emerald-400/10'
        : 'w-6 h-6 rounded-full border-emerald-400/50 bg-transparent';

  return (
    <>
      <div
        ref={ringRef}
        data-testid="custom-cursor"
        data-cursor-mode={mode}
        aria-hidden="true"
        className={`fixed top-0 left-0 z-50 pointer-events-none transition-opacity duration-150 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div
          className={`-translate-x-1/2 -translate-y-1/2 border-[1.5px] transition-all duration-150 ease-out flex items-center justify-center ${sizeClass} ${
            pressed ? 'scale-75' : 'scale-100'
          }`}
        >
          {mode === 'orbit' && (
            <span className="-rotate-45 font-mono text-[8px] font-semibold text-cyan-300 tracking-tighter">
              3D
            </span>
          )}
        </div>
      </div>

      <div
        ref={dotRef}
        aria-hidden="true"
        className={`fixed top-0 left-0 z-50 pointer-events-none transition-opacity duration-150 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div
          className={`-translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-150 ${
            mode === 'interactive'
              ? 'w-1.5 h-1.5 bg-emerald-300 scale-75'
              : mode === 'orbit'
                ? 'w-1.5 h-1.5 bg-cyan-300'
                : 'w-1.5 h-1.5 bg-emerald-400'
          } ${pressed ? 'scale-150' : ''}`}
        />
      </div>
    </>
  );
}
