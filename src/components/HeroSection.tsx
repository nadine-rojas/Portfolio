import { useEffect, useRef, useState } from 'react';
import {
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
  Crown,
  MessageSquare,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import { PROFILE_DATA } from '../data/portfolioData';
import {
  type ChessFinishKind,
  type ChessPieceKind,
  type ChessSceneController,
  mountChessHeroScene,
} from '../three/chessScene';

const PIECE_OPTIONS: { id: ChessPieceKind; label: string }[] = [
  { id: 'knight', label: 'Caballo' },
  { id: 'king', label: 'Rey' },
];

const FINISH_OPTIONS: { id: ChessFinishKind; label: string; swatchClass: string }[] = [
  { id: 'obsidian_gold', label: 'Obsidiana y Oro', swatchClass: 'bg-amber-400' },
  { id: 'emerald_crystal', label: 'Cristal Esmeralda', swatchClass: 'bg-emerald-400' },
  { id: 'cyan_titanium', label: 'Titanio Cian', swatchClass: 'bg-cyan-400' },
];

export function HeroSection() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<ChessSceneController | null>(null);

  const [piece, setPiece] = useState<ChessPieceKind>('knight');
  const [finish, setFinish] = useState<ChessFinishKind>('obsidian_gold');
  const [autoRotate, setAutoRotate] = useState(true);
  const [dockOpen, setDockOpen] = useState(true);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    try {
      const controller = mountChessHeroScene(mount, {
        initialPiece: 'knight',
        initialFinish: 'obsidian_gold',
        initialAutoRotate: true,
        onWebGLFallback: () => setWebglUnavailable(true),
      });
      controllerRef.current = controller;

      return () => {
        controller.dispose();
        controllerRef.current = null;
      };
    } catch {
      setWebglUnavailable(true);
    }
  }, []);

  const handlePieceChange = (nextPiece: ChessPieceKind) => {
    setPiece(nextPiece);
    controllerRef.current?.setPiece(nextPiece);
  };

  const handleFinishChange = (nextFinish: ChessFinishKind) => {
    setFinish(nextFinish);
    controllerRef.current?.setFinish(nextFinish);
  };

  const handleToggleRotate = () => {
    const next = !autoRotate;
    setAutoRotate(next);
    controllerRef.current?.setAutoRotate(next);
  };

  const handleResetCamera = () => {
    controllerRef.current?.resetCamera();
  };

  return (
    <section
      id="inicio"
      className="relative min-h-screen w-full overflow-hidden bg-[#16181d] flex items-center pt-24 pb-28"
    >
      {/* Lienzo 3D aislado con atributo para morphing del cursor orbital */}
      <div
        ref={canvasMountRef}
        data-testid="hero-3d-canvas"
        data-cursor="orbit"
        data-piece={piece}
        data-finish={finish}
        className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing"
      />

      {/* Respaldo elegante si WebGL no está disponible */}
      {webglUnavailable && (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 flex items-center justify-end pr-16 pointer-events-none opacity-55"
        >
          <div className="neu-surface w-80 h-80 rounded-full border border-emerald-500/20 flex items-center justify-center">
            <Crown className="w-24 h-24 text-emerald-400/75" />
          </div>
        </div>
      )}

      {/* Gradiente izquierdo en #16181d para mantener legibilidad WCAG AA sobre el canvas 3D */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-r from-[#16181d] via-[#16181d]/82 to-transparent lg:w-3/5"
      />

      {/* Contenido tipográfico principal */}
      <div className="relative z-10 mx-auto max-w-6xl w-full px-4 sm:px-6 pointer-events-none">
        <div className="max-w-xl pointer-events-auto">
          <p className="text-sm sm:text-base font-medium text-emerald-400 tracking-wide mb-3">
            {PROFILE_DATA.heroRole}
          </p>

          <h1
            className="font-display font-bold tracking-tight text-slate-50 leading-[1.06] mb-5"
            style={{
              fontSize: 'clamp(2.35rem, 4.8vw, 4rem)',
              textWrap: 'balance',
            }}
          >
            {PROFILE_DATA.heroHeadlinePrefix}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-cyan-300 to-amber-200">
              {PROFILE_DATA.heroHeadlineName}
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-lg mb-8">
            {PROFILE_DATA.heroIntro}
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href="#proyectos"
              className="neu-btn-accent inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-semibold text-sm sm:text-base whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
            >
              <span>Ver Proyectos</span>
              <ArrowDownRight className="w-4 h-4" />
            </a>

            <a
              href="#contacto"
              className="neu-btn inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-white/[0.05] text-slate-100 font-medium text-sm sm:text-base hover:text-emerald-200 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Hablemos</span>
            </a>
          </div>

          <p className="mt-6 text-xs text-slate-400">
            Arrastra la pieza 3D en pantalla para inspeccionarla en 360° o mueve el puntero para guiar a la araña IK
          </p>
        </div>
      </div>

      {/* Dock neumórfico colapsable inferior para controlar la escena 3D */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center w-max max-w-[94vw]">
        <button
          type="button"
          onClick={() => setDockOpen((prev) => !prev)}
          aria-expanded={dockOpen}
          className="neu-surface-sm inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-t-xl border border-b-0 border-white/[0.05] text-xs font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-emerald-400"
        >
          <span>{dockOpen ? 'Ocultar controles 3D' : 'Controles 3D'}</span>
          {dockOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>

        {dockOpen && (
          <div
            data-neu-climbable="true"
            className="neu-surface flex flex-wrap md:flex-nowrap items-center justify-center gap-2 sm:gap-3 px-3.5 py-2.5 rounded-2xl border border-white/[0.05]"
          >
            {/* Selector de pieza */}
            <div className="neu-inset flex items-center gap-1 p-1 rounded-xl" role="group" aria-label="Pieza 3D">
              {PIECE_OPTIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handlePieceChange(item.id)}
                  aria-pressed={piece === item.id}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-emerald-400 ${
                    piece === item.id
                      ? 'neu-btn-accent font-semibold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <span aria-hidden="true" className="hidden sm:block h-5 w-px bg-white/10" />

            {/* Selector de acabado */}
            <div className="neu-inset flex items-center gap-1 p-1 rounded-xl" role="group" aria-label="Acabado 3D">
              {FINISH_OPTIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleFinishChange(item.id)}
                  aria-pressed={finish === item.id}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-emerald-400 ${
                    finish === item.id
                      ? 'neu-btn text-emerald-300 border border-emerald-400/25'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${item.swatchClass}`} aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            <span aria-hidden="true" className="hidden sm:block h-5 w-px bg-white/10" />

            {/* Auto-rotación y reinicio */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleToggleRotate}
                aria-pressed={autoRotate}
                aria-label={autoRotate ? 'Pausar rotación automática' : 'Activar rotación automática'}
                className="neu-btn inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-white/[0.05] text-xs font-medium text-slate-200 hover:border-emerald-400/35 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-emerald-400"
              >
                {autoRotate ? <Pause className="w-3.5 h-3.5 text-emerald-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{autoRotate ? 'Pausar giro' : 'Girar'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetCamera}
                aria-label="Restablecer cámara 3D"
                className="neu-btn inline-flex items-center justify-center w-8 h-8 rounded-xl border border-white/[0.05] text-slate-300 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-400"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
