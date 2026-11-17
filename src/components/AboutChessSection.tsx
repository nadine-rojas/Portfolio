import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { CHESS_STRENGTHS, PROFILE_DATA, TECH_STACK } from '../data/portfolioData';
import {
  CHESS_OPENINGS,
  type ChessPiece,
  clampStep,
  getBoardSnapshot,
} from '../utils/chessOpenings';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

function ChessPieceGlyph({ piece }: { piece: ChessPiece }) {
  const isWhite = piece.color === 'w';
  const fill = isWhite ? '#f8fafc' : '#111827';
  const stroke = isWhite ? '#0f172a' : '#34d399';
  const detail = isWhite ? '#334155' : '#6ee7b7';

  return (
    <svg
      viewBox="0 0 45 45"
      className="w-[78%] h-[78%] drop-shadow-sm select-none"
      aria-hidden="true"
    >
      {piece.type === 'P' && (
        <path
          d="M 22.5,9 C 19.5,9 17.5,11.5 17.5,14.5 C 17.5,16.5 18.5,18.2 20,19.2 C 16.5,20.8 14.5,24 14.5,27.5 C 14.5,30 16,32 17,33 L 12,37 L 33,37 L 28,33 C 29,32 30.5,30 30.5,27.5 C 30.5,24 28.5,20.8 25,19.2 C 26.5,18.2 27.5,16.5 27.5,14.5 C 27.5,11.5 25.5,9 22.5,9 z"
          fill={fill}
          stroke={stroke}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {piece.type === 'R' && (
        <g fill={fill} stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z" />
          <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z" />
          <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14" />
          <path d="M 34,14 L 31,17 L 14,17 L 11,14" />
          <path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17" />
          <path d="M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5" />
        </g>
      )}

      {piece.type === 'N' && (
        <g fill={fill} stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" />
          <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10" />
          <circle cx="15" cy="15.5" r="1.2" fill={detail} stroke="none" />
        </g>
      )}

      {piece.type === 'B' && (
        <g fill={fill} stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.06 9,36 9,36 z" />
          <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z" />
          <circle cx="22.5" cy="8" r="2.2" />
          <path d="M 19,20 L 26,20 M 22.5,16.5 L 22.5,23.5" stroke={detail} strokeWidth="1.5" />
        </g>
      )}

      {piece.type === 'Q' && (
        <g fill={fill} stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="12" r="2.2" />
          <circle cx="14" cy="9" r="2.2" />
          <circle cx="22.5" cy="8" r="2.2" />
          <circle cx="31" cy="9" r="2.2" />
          <circle cx="39" cy="12" r="2.2" />
          <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 L 9,26 z" />
          <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10.5,36 C 9,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z" />
        </g>
      )}

      {piece.type === 'K' && (
        <g fill={fill} stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 22.5,11.63 L 22.5,6" />
          <path d="M 20,8 L 25,8" />
          <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" />
          <path d="M 11.5,37 C 17,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 19,16 9.5,13 6.5,19.5 C 3.5,25.5 11.5,29.5 11.5,29.5 L 11.5,37 z" />
          <path d="M 11.5,30 C 17,27 27,27 32.5,30" stroke={detail} />
          <path d="M 11.5,33.5 C 17,30.5 27,30.5 32.5,33.5" stroke={detail} />
        </g>
      )}
    </svg>
  );
}

export function AboutChessSection() {
  const [selectedOpeningId, setSelectedOpeningId] = useState(CHESS_OPENINGS[0].id);
  const [stepIndex, setStepIndex] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);

  const activeOpening = useMemo(
    () => CHESS_OPENINGS.find((o) => o.id === selectedOpeningId) ?? CHESS_OPENINGS[0],
    [selectedOpeningId],
  );

  const snapshot = useMemo(
    () => getBoardSnapshot(activeOpening, stepIndex),
    [activeOpening, stepIndex],
  );

  useEffect(() => {
    if (!isPlaying) return;
    if (stepIndex >= activeOpening.moves.length) {
      setIsPlaying(false);
      return;
    }
    const timer = window.setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= activeOpening.moves.length) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1100);
    return () => window.clearInterval(timer);
  }, [isPlaying, stepIndex, activeOpening.moves.length]);

  const handleSelectOpening = (id: string) => {
    setIsPlaying(false);
    setSelectedOpeningId(id);
    setStepIndex(0);
  };

  const handleStep = (delta: number) => {
    setIsPlaying(false);
    setStepIndex((prev) => clampStep(prev + delta, activeOpening.moves.length));
  };

  const handleReset = () => {
    setIsPlaying(false);
    setStepIndex(0);
  };

  const handleTogglePlay = () => {
    if (stepIndex >= activeOpening.moves.length) {
      setStepIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  return (
    <section id="sobre-mi" className="py-24 sm:py-28 border-t border-white/[0.04] bg-[#16181d]">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.08 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-6xl px-4 sm:px-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-start">
          {/* Columna izquierda: Perfil de Leia Rojas + Ventajas del ajedrez + Stack técnico */}
          <div className="lg:col-span-6">
            <p className="text-sm font-medium text-emerald-400 tracking-wide mb-2">
              Sobre mí y estrategia
            </p>
            <h2
              className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-50 mb-5"
              style={{ textWrap: 'balance' }}
            >
              {PROFILE_DATA.aboutTitle}
            </h2>

            <div className="space-y-4 text-slate-300 text-base leading-relaxed mb-8">
              {PROFILE_DATA.aboutParagraphs.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>

            {/* Tarjetas neumórficas de fortalezas cognitivas del ajedrez */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {CHESS_STRENGTHS.map((item) => (
                <div
                  key={item.title}
                  data-neu-climbable="true"
                  className="neu-surface-sm rounded-2xl border border-white/[0.04] p-4 hover:border-emerald-500/25 transition-colors"
                >
                  <h3 className="font-display text-sm font-semibold text-slate-100 mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Stack tecnológico principal */}
            <div>
              <h3 className="text-sm font-semibold text-slate-200 mb-3">
                Tecnologías principales
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 border-t border-white/[0.06] pt-4">
                {TECH_STACK.map((tech) => (
                  <div key={tech.name}>
                    <div className="text-sm font-medium text-slate-100">{tech.name}</div>
                    <div className="text-xs text-slate-400">{tech.role}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Columna derecha: Widget neumórfico interactivo "Jugada Destacada" */}
          <div className="lg:col-span-6">
            <div
              data-neu-climbable="true"
              className="neu-surface rounded-3xl border border-white/[0.04] p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
                <div>
                  <p className="text-xs font-medium text-emerald-400">Jugada Destacada</p>
                  <h3 className="font-display text-xl font-semibold text-slate-50">
                    {activeOpening.name}
                  </h3>
                </div>
                <span className="font-mono text-xs text-slate-400 tabular-nums">
                  {activeOpening.eco}
                </span>
              </div>

              {/* Pestañas de aperturas */}
              <div
                className="neu-inset flex flex-wrap gap-1.5 p-1.5 rounded-2xl mb-5"
                role="tablist"
                aria-label="Seleccionar apertura de ajedrez"
              >
                {CHESS_OPENINGS.map((opening) => {
                  const selected = opening.id === activeOpening.id;
                  return (
                    <button
                      key={opening.id}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => handleSelectOpening(opening.id)}
                      className={`flex-1 min-w-[120px] px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap focus-visible:outline-2 focus-visible:outline-emerald-400 ${
                        selected
                          ? 'neu-btn-accent font-semibold'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {opening.name}
                    </button>
                  );
                })}
              </div>

              {/* Mini-tablero interactivo 8x8 en marco hundido neumórfico */}
              <div className="mx-auto max-w-[380px]">
                <div className="neu-inset p-2 rounded-2xl">
                  <div
                    role="grid"
                    aria-label={`Tablero de ajedrez: ${activeOpening.name}, jugada ${snapshot.currentMoveIndex} de ${snapshot.totalMoves}`}
                    className="aspect-square w-full grid grid-cols-8 grid-rows-8 rounded-xl overflow-hidden border border-white/[0.06]"
                  >
                    {snapshot.board.map((row, rIdx) =>
                      row.map((cell, cIdx) => {
                        const isLightSquare = (rIdx + cIdx) % 2 === 0;
                        const isFrom =
                          snapshot.lastFrom?.[0] === rIdx && snapshot.lastFrom?.[1] === cIdx;
                        const isTo =
                          snapshot.lastTo?.[0] === rIdx && snapshot.lastTo?.[1] === cIdx;

                        let squareBg = isLightSquare ? 'bg-[#262b36]' : 'bg-[#13151b]';
                        if (isFrom) squareBg = 'bg-emerald-600/35';
                        if (isTo) squareBg = 'bg-emerald-500/50';

                        return (
                          <div
                            key={`${rIdx}-${cIdx}`}
                            className={`relative flex items-center justify-center ${squareBg} transition-colors duration-150`}
                          >
                            {cIdx === 0 && (
                              <span className="absolute top-0.5 left-1 font-mono text-[9px] text-slate-400/75 select-none">
                                {RANKS[rIdx]}
                              </span>
                            )}
                            {rIdx === 7 && (
                              <span className="absolute bottom-0.5 right-1 font-mono text-[9px] text-slate-400/75 select-none">
                                {FILES[cIdx]}
                              </span>
                            )}
                            {cell && <ChessPieceGlyph piece={cell} />}
                          </div>
                        );
                      }),
                    )}
                  </div>
                </div>

                {/* Controles de reproducción y contador */}
                <div className="mt-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleReset}
                      aria-label="Reiniciar apertura"
                      className="neu-btn inline-flex items-center justify-center w-9 h-9 rounded-xl border border-white/[0.04] text-slate-300 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-400"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStep(-1)}
                      disabled={snapshot.currentMoveIndex === 0}
                      aria-label="Jugada anterior"
                      className="neu-btn inline-flex items-center justify-center w-9 h-9 rounded-xl border border-white/[0.04] text-slate-200 disabled:opacity-35 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-emerald-400"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleTogglePlay}
                      aria-label={isPlaying ? 'Pausar secuencia' : 'Reproducir secuencia'}
                      className="neu-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-500/25 text-xs font-medium text-emerald-300 hover:border-emerald-400/45 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-emerald-400"
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{isPlaying ? 'Pausar' : 'Reproducir'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStep(1)}
                      disabled={snapshot.currentMoveIndex >= snapshot.totalMoves}
                      aria-label="Siguiente jugada"
                      className="neu-btn inline-flex items-center justify-center w-9 h-9 rounded-xl border border-white/[0.04] text-slate-200 disabled:opacity-35 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-emerald-400"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div
                    data-testid="chess-move-counter"
                    className="font-mono text-xs text-slate-200 tabular-nums whitespace-nowrap shrink-0"
                  >
                    <span className="text-emerald-400 font-semibold">{snapshot.activeNotation}</span>
                    <span className="text-slate-500 mx-1.5">·</span>
                    <span>
                      {snapshot.currentMoveIndex}/{snapshot.totalMoves}
                    </span>
                  </div>
                </div>

                {/* Lista rápida de jugadas clicables */}
                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  {activeOpening.moves.map((m, idx) => {
                    const moveNum = idx + 1;
                    const active = snapshot.currentMoveIndex === moveNum;
                    return (
                      <button
                        key={m.notation}
                        type="button"
                        onClick={() => {
                          setIsPlaying(false);
                          setStepIndex(moveNum);
                        }}
                        className={`px-2.5 py-1 rounded-lg font-mono text-xs tabular-nums transition-all focus-visible:outline-2 focus-visible:outline-emerald-400 ${
                          active
                            ? 'neu-btn-accent font-semibold'
                            : 'neu-btn text-slate-300 hover:text-white'
                        }`}
                      >
                        {m.notation}
                      </button>
                    );
                  })}
                </div>

                {/* Comentario estratégico de la jugada */}
                <p className="mt-4 pt-3 border-t border-white/[0.06] text-xs sm:text-sm text-slate-300 leading-relaxed min-h-[3.25rem]">
                  {snapshot.comment}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
