import { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { AboutChessSection } from './components/AboutChessSection';
import { ContactFooter } from './components/ContactFooter';
import { CustomCursor } from './components/CustomCursor';
import { HeroSection } from './components/HeroSection';
import { Navbar } from './components/Navbar';
import { ProjectsSection } from './components/ProjectsSection';
import { SpiderOverlay } from './components/SpiderOverlay';

export default function App() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => {
      setToastMessage(null);
    }, 5500);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  return (
    <div className="min-h-screen bg-[#16181d] text-slate-100">
      <SpiderOverlay />
      <CustomCursor />

      <Navbar />

      <main>
        <HeroSection />
        <AboutChessSection />
        <ProjectsSection />
      </main>

      <ContactFooter onToast={(msg) => setToastMessage(msg)} />

      {/* Notificación toast neumórfica accesible al enviar el formulario */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          data-testid="contact-toast"
          className="neu-surface fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl border border-emerald-500/35 px-4 py-3.5 flex items-start gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-100 leading-snug flex-1">{toastMessage}</p>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            aria-label="Cerrar notificación"
            className="text-slate-400 hover:text-white transition-colors p-0.5 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
