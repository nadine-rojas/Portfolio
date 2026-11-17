import { type FormEvent, useState } from 'react';
import {
  CheckCircle2,
  Code2,
  Crown,
  Github,
  Linkedin,
  MapPin,
  Send,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import { PROFILE_DATA, SOCIAL_LINKS, type SocialLinkItem } from '../data/portfolioData';
import { type ContactFormErrors, validateContactForm } from '../utils/portfolioLogic';

function SocialIcon({ id }: { id: SocialLinkItem['id'] }) {
  switch (id) {
    case 'github':
      return <Github className="w-4 h-4 text-emerald-400" />;
    case 'linkedin':
      return <Linkedin className="w-4 h-4 text-cyan-400" />;
    case 'codedex':
      return <Code2 className="w-4 h-4 text-amber-300" />;
    case 'lichess':
      return <Crown className="w-4 h-4 text-emerald-300" />;
  }
}

interface ContactFooterProps {
  onToast: (message: string) => void;
}

export function ContactFooter({ onToast }: ContactFooterProps) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [sentInfo, setSentInfo] = useState<{ nombre: string; email: string } | null>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validation = validateContactForm({ nombre, email, mensaje });
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setSentInfo({ nombre: nombre.trim(), email: email.trim() });
    onToast(`¡Mensaje recibido! Gracias, ${nombre.trim()}, te responderé pronto.`);
    setNombre('');
    setEmail('');
    setMensaje('');
  };

  return (
    <footer id="contacto" className="border-t border-white/[0.04] bg-[#16181d]">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.08 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-6xl px-4 sm:px-6 py-24 sm:py-28"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-start">
          {/* Columna izquierda: Invitación y tarjetas sociales neumórficas */}
          <div className="lg:col-span-5">
            <p className="text-sm font-medium text-emerald-400 tracking-wide mb-2">
              Contacto directo
            </p>
            <h2
              className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-50 mb-4"
              style={{ textWrap: 'balance' }}
            >
              ¿Construimos algo memorable juntos?
            </h2>
            <p className="text-slate-300 text-base leading-relaxed mb-6">
              Estoy abierta a colaboraciones freelance, proyectos creativos en la web y nuevas oportunidades como desarrolladora frontend o full-stack. O si prefieres, te acepto una partida rápida en Lichess.
            </p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-300 mb-8 pb-6 border-b border-white/[0.06]">
              <span className="inline-flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>{PROFILE_DATA.location}</span>
              </span>
              <span className="inline-flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-300" />
                <span>{PROFILE_DATA.chessRating}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {SOCIAL_LINKS.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-neu-climbable="true"
                  className="neu-surface-sm flex items-center gap-3 rounded-2xl border border-white/[0.04] px-4 py-3.5 hover:border-emerald-400/35 transition-colors focus-visible:outline-2 focus-visible:outline-emerald-400"
                >
                  <SocialIcon id={item.id} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-100">{item.label}</div>
                    <div className="text-xs text-slate-400 truncate">{item.handle}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Columna derecha: Formulario neumórfico de contacto */}
          <div className="lg:col-span-7">
            <div
              data-neu-climbable="true"
              className="neu-surface rounded-3xl border border-white/[0.04] p-6 sm:p-8"
            >
              {sentInfo ? (
                <div
                  data-testid="contact-confirmation"
                  className="py-6 text-center sm:text-left"
                >
                  <div className="neu-inset inline-flex items-center justify-center w-12 h-12 rounded-2xl text-emerald-400 mb-4">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-2xl font-semibold text-slate-50 mb-2">
                    Mensaje enviado con éxito
                  </h3>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
                    Gracias por escribir, <strong className="text-white">{sentInfo.nombre}</strong>. He registrado tu consulta asociada a <span className="font-mono text-emerald-300">{sentInfo.email}</span> y te responderé muy pronto.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSentInfo(null)}
                    className="neu-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/[0.05] text-sm font-medium text-slate-200 hover:border-emerald-400/40 focus-visible:outline-2 focus-visible:outline-emerald-400"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Enviar otro mensaje</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label
                        htmlFor="contact-nombre"
                        className="block text-sm font-medium text-slate-200 mb-2"
                      >
                        Nombre
                      </label>
                      <input
                        id="contact-nombre"
                        name="nombre"
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        aria-invalid={Boolean(errors.nombre)}
                        placeholder="Tu nombre completo"
                        className="neu-inset w-full rounded-xl border border-white/[0.04] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400/60 focus:outline-none transition-colors"
                      />
                      {errors.nombre && (
                        <p role="alert" className="mt-1.5 text-xs text-rose-400">
                          {errors.nombre}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="contact-email"
                        className="block text-sm font-medium text-slate-200 mb-2"
                      >
                        Email
                      </label>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        aria-invalid={Boolean(errors.email)}
                        placeholder="tu@correo.com"
                        className="neu-inset w-full rounded-xl border border-white/[0.04] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400/60 focus:outline-none transition-colors"
                      />
                      {errors.email && (
                        <p role="alert" className="mt-1.5 text-xs text-rose-400">
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="contact-mensaje"
                      className="block text-sm font-medium text-slate-200 mb-2"
                    >
                      Mensaje
                    </label>
                    <textarea
                      id="contact-mensaje"
                      name="mensaje"
                      rows={4}
                      value={mensaje}
                      onChange={(e) => setMensaje(e.target.value)}
                      aria-invalid={Boolean(errors.mensaje)}
                      placeholder="Cuéntame sobre tu proyecto, equipo o idea..."
                      className="neu-inset w-full rounded-xl border border-white/[0.04] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400/60 focus:outline-none transition-colors resize-y"
                    />
                    {errors.mensaje && (
                      <p role="alert" className="mt-1.5 text-xs text-rose-400">
                        {errors.mensaje}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                    <p className="text-xs text-slate-400">
                      Respuesta habitual en menos de 24 horas.
                    </p>
                    <button
                      type="submit"
                      className="neu-btn-accent inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
                    >
                      <Send className="w-4 h-4" />
                      <span>Enviar mensaje</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Pie de página limpio con Leia Rojas */}
        <div className="mt-16 pt-8 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            © {new Date().getFullYear()} {PROFILE_DATA.name}. Portafolio interactivo listo para Codédex.
          </p>
          <div className="flex items-center gap-6">
            <a href="#inicio" className="hover:text-slate-200 transition-colors">
              Inicio
            </a>
            <a href="#sobre-mi" className="hover:text-slate-200 transition-colors">
              Sobre Mí
            </a>
            <a href="#proyectos" className="hover:text-slate-200 transition-colors">
              Proyectos
            </a>
          </div>
        </div>
      </motion.div>
    </footer>
  );
}
