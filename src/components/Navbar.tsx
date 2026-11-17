import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { PROFILE_DATA } from '../data/portfolioData';

const NAV_ITEMS = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Sobre Mí', href: '#sobre-mi' },
  { label: 'Proyectos', href: '#proyectos' },
  { label: 'Contacto', href: '#contacto' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-4 left-0 right-0 z-40 px-4 sm:px-6 pointer-events-none">
      <div className="neu-surface mx-auto max-w-6xl rounded-2xl border border-white/[0.05] px-4 sm:px-6 py-3 pointer-events-auto">
        <div className="flex items-center justify-between gap-8">
          {/* Zona 1: Marca personal Leia Rojas */}
          <a
            href="#inicio"
            className="font-display text-base sm:text-lg font-semibold tracking-tight text-slate-100 hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400 rounded"
          >
            {PROFILE_DATA.brandMark}
          </a>

          {/* Zona 2: Enlaces de navegación en una sola línea */}
          <nav
            aria-label="Navegación principal"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300"
          >
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="relative py-1 hover:text-emerald-300 transition-colors whitespace-nowrap shrink-0 after:absolute after:left-0 after:bottom-0 after:h-px after:w-0 after:bg-emerald-400 after:transition-all hover:after:w-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400 rounded"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Zona 3: Estado de disponibilidad neumórfico + botón menú móvil */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="#contacto"
              className="neu-btn hidden sm:inline-flex items-center px-3.5 py-2 rounded-xl border border-emerald-500/25 text-xs font-medium text-emerald-300 hover:text-emerald-200 hover:border-emerald-400/45 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
            >
              {PROFILE_DATA.availabilityLabel}
            </a>

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-menu"
              aria-label={mobileOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
              className="neu-btn md:hidden inline-flex items-center justify-center w-11 h-11 rounded-xl border border-white/[0.05] text-slate-200 focus-visible:outline-2 focus-visible:outline-emerald-400"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Menú desplegable móvil */}
        {mobileOpen && (
          <nav
            id="mobile-nav-menu"
            aria-label="Navegación móvil"
            className="md:hidden mt-3 pt-3 border-t border-white/[0.06] flex flex-col gap-1.5"
          >
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-white/[0.03] hover:text-emerald-300 transition-colors"
              >
                {item.label}
              </a>
            ))}
            <a
              href="#contacto"
              onClick={() => setMobileOpen(false)}
              className="neu-btn mt-1 px-3 py-2.5 rounded-xl border border-emerald-500/25 text-sm font-medium text-emerald-300 text-center"
            >
              {PROFILE_DATA.availabilityLabel}
            </a>
          </nav>
        )}
      </div>
    </header>
  );
}
