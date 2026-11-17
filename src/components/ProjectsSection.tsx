import { type MouseEvent, useEffect, useMemo, useState } from 'react';
import { ExternalLink, Eye, Layers, X } from 'lucide-react';
import { motion } from 'motion/react';
import {
  PROJECT_CATEGORIES,
  PROJECTS_DATA,
  type ProjectCategory,
  type ProjectItem,
} from '../data/portfolioData';
import { computeCardTilt, filterProjects } from '../utils/portfolioLogic';

const ACCENT_BORDER: Record<ProjectItem['accent'], string> = {
  emerald: 'hover:border-emerald-400/40',
  cyan: 'hover:border-cyan-400/40',
  gold: 'hover:border-amber-400/40',
};

interface ProjectCardProps {
  project: ProjectItem;
  onOpenPreview: (project: ProjectItem) => void;
}

/**
 * Tarjeta neumórfica de proyecto real con inclinación 3D al pasar el cursor
 * y enlace directo a la demo en vivo.
 */
function ProjectCard({ project, onOpenPreview }: ProjectCardProps) {
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [imgFailed, setImgFailed] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTilt(computeCardTilt(e.clientX, e.clientY, rect, 4.5));
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0 });
  };

  return (
    <article
      data-neu-climbable="true"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
        transition: 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1), border-color 180ms ease',
      }}
      className={`group neu-surface rounded-3xl border border-white/[0.04] overflow-hidden flex flex-col ${ACCENT_BORDER[project.accent]}`}
    >
      {/* Vista previa empotrada en marco neumórfico hundido */}
      <div className="p-3 pb-0">
        <div className="neu-inset relative aspect-[4/3] w-full rounded-2xl overflow-hidden border border-white/[0.04]">
          {!imgFailed ? (
            <img
              src={project.image}
              alt={`Vista previa del proyecto ${project.title}`}
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#13151a] p-6 text-center">
              <Layers className="w-9 h-9 text-emerald-400" />
              <span className="font-display text-sm font-semibold text-slate-200">
                {project.title}
              </span>
            </div>
          )}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#13151a]/75 via-transparent to-transparent pointer-events-none"
          />
        </div>
      </div>

      {/* Cuerpo de la tarjeta */}
      <div className="p-5 sm:p-6 flex flex-col flex-1">
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
          <span className="text-emerald-400 font-medium">{project.category}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">{project.year}</span>
        </div>

        <h3 className="font-display text-lg sm:text-xl font-semibold text-slate-50 mb-2.5 group-hover:text-emerald-300 transition-colors">
          {project.title}
        </h3>

        <p className="text-sm text-slate-300 leading-relaxed mb-4 flex-1">
          {project.description}
        </p>

        {/* Etiquetas técnicas sin píldoras */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-mono text-slate-400 mb-5 pt-3 border-t border-white/[0.06]">
          {project.tags.map((tag, idx) => (
            <span key={tag} className="inline-flex items-center gap-2.5">
              <span>{tag}</span>
              {idx < project.tags.length - 1 && (
                <span aria-hidden="true" className="text-slate-600">
                  /
                </span>
              )}
            </span>
          ))}
        </div>

        {/* Botones de acción: enlace directo "Demo en Vivo" + "Detalles" */}
        <div className="flex items-center gap-3">
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Demo en Vivo de ${project.title}`}
            className="neu-btn-accent flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Demo en Vivo</span>
          </a>

          <button
            type="button"
            onClick={() => onOpenPreview(project)}
            aria-label={`Ver detalles de ${project.title}`}
            className="neu-btn inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-white/[0.04] text-slate-200 font-medium text-xs sm:text-sm hover:text-emerald-200 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
          >
            <Eye className="w-4 h-4 text-emerald-400" />
            <span>Detalles</span>
          </button>
        </div>
      </div>
    </article>
  );
}

export function ProjectsSection() {
  const [activeCategory, setActiveCategory] = useState<ProjectCategory>('Todos');
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);

  useEffect(() => {
    if (!selectedProject) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedProject(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedProject]);

  const visibleProjects = useMemo(
    () => filterProjects(PROJECTS_DATA, activeCategory),
    [activeCategory],
  );

  return (
    <section id="proyectos" className="py-24 sm:py-28 border-t border-white/[0.04] bg-[#16181d]">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.08 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-6xl px-4 sm:px-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-emerald-400 tracking-wide mb-2">
              Portafolio real en producción
            </p>
            <h2
              className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-50 mb-3"
              style={{ textWrap: 'balance' }}
            >
              Mis Proyectos
            </h2>
            <p className="text-slate-300 text-base leading-relaxed">
              Aplicaciones web interactivas, mundos 3D, catálogos comerciales y experiencias literarias desplegadas en línea.
            </p>
          </div>

          {/* Barra neumórfica de filtros por categoría */}
          <div
            className="neu-inset flex flex-wrap sm:flex-nowrap items-center gap-1.5 p-1.5 rounded-2xl self-start lg:self-end shrink-0"
            role="group"
            aria-label="Filtrar proyectos por categoría"
          >
            {PROJECT_CATEGORIES.map((category) => {
              const active = activeCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  aria-pressed={active}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-emerald-400 ${
                    active
                      ? 'neu-btn-accent font-semibold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cuadrícula responsiva de los 6 proyectos reales */}
        <div
          data-testid="projects-grid"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7"
        >
          {visibleProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onOpenPreview={setSelectedProject}
            />
          ))}
        </div>
      </motion.div>

      {/* Modal de detalles del proyecto */}
      {selectedProject && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="neu-surface relative w-full max-w-2xl rounded-3xl border border-white/[0.06] p-6 sm:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs font-medium text-emerald-400 mb-1">
                  {selectedProject.category} · {selectedProject.year}
                </p>
                <h3
                  id="project-modal-title"
                  className="font-display text-2xl font-bold text-slate-50"
                >
                  {selectedProject.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                aria-label="Cerrar detalles del proyecto"
                className="neu-btn inline-flex items-center justify-center w-10 h-10 rounded-xl border border-white/[0.05] text-slate-300 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="neu-inset aspect-[16/9] w-full rounded-2xl overflow-hidden border border-white/[0.05] mb-5">
              <img
                src={selectedProject.image}
                alt={`Captura ampliada de ${selectedProject.title}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-4">
              {selectedProject.description}
            </p>

            <ul className="space-y-2 mb-6">
              {selectedProject.highlights.map((highlight) => (
                <li key={highlight} className="text-sm text-slate-300 flex items-start gap-2.5">
                  <span className="text-emerald-400 font-mono mt-0.5" aria-hidden="true">
                    —
                  </span>
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="neu-btn px-4 py-2.5 rounded-xl border border-white/[0.05] text-sm font-medium text-slate-300 hover:text-white"
              >
                Cerrar
              </button>

              <a
                href={selectedProject.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="neu-btn-accent inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Abrir Demo en Vivo</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
