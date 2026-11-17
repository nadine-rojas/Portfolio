/**
 * ============================================================================
 * CONFIGURACIÓN DEL PORTAFOLIO — LEIA ROJAS
 * ============================================================================
 * Centraliza los datos personales, proyectos reales, stack técnico y redes.
 */

export type ProjectCategory =
  | 'Todos'
  | 'Salud & Fit'
  | 'Juegos 3D'
  | 'Comercio'
  | 'Lectura';

export interface ProjectItem {
  id: string;
  title: string;
  category: Exclude<ProjectCategory, 'Todos'>;
  year: string;
  description: string;
  highlights: string[];
  tags: string[];
  image: string;
  liveUrl: string;
  accent: 'emerald' | 'cyan' | 'gold';
}

export interface SocialLinkItem {
  id: 'github' | 'linkedin' | 'codedex' | 'lichess';
  label: string;
  handle: string;
  url: string;
}

export interface TechStackItem {
  name: string;
  role: string;
}

export interface ChessStrengthItem {
  title: string;
  description: string;
}

export const PROFILE_DATA = {
  name: 'Leia Rojas',
  brandMark: 'Leia Rojas',
  availabilityLabel: 'Disponible para proyectos',
  heroRole: 'Desarrolladora Web & Entusiasta del Ajedrez',
  heroHeadlinePrefix: 'Hola, soy',
  heroHeadlineName: 'Leia Rojas',
  heroIntro:
    'Creo experiencias web interactivas, mundos 3D en el navegador y productos digitales donde cada decisión combina diseño táctil y pensamiento estratégico.',
  aboutTitle: 'Código con visión estratégica, jugada a jugada',
  aboutParagraphs: [
    'Soy Leia Rojas, desarrolladora web apasionada por construir aplicaciones útiles, expresivas y rápidas directamente para el navegador: desde mundos sandbox en 3D hasta calculadoras de bienestar y experiencias editoriales.',
    'El ajedrez es mucho más que un pasatiempo en mi rutina: es mi gimnasio mental diario. Analizar posiciones complejas en el tablero entrena mi pensamiento lógico, el reconocimiento de patrones y la calma para resolver errores críticos en producción.',
  ],
  location: 'Remoto · Mundo Hispano',
  chessRating: '1840 ELO · Lichess Rápidas',
  codedexHandle: '@leiarojas',
};

export const CHESS_STRENGTHS: ChessStrengthItem[] = [
  {
    title: 'Reconocimiento de Patrones',
    description:
      'Identificar motivos tácticos en segundos se traduce directamente en detectar cuellos de botella y refactorizar código repetitivo.',
  },
  {
    title: 'Cálculo de Variantes',
    description:
      'Anticipar tres o cuatro jugadas por delante me ayuda a diseñar estados predecibles, casos límite y flujos libres de regresiones.',
  },
  {
    title: 'Paciencia Posicional',
    description:
      'Mejorar la pieza peor colocada antes de lanzar un ataque equivale a consolidar cimientos sólidos antes de escalar funcionalidades.',
  },
  {
    title: 'Gestión del Tiempo',
    description:
      'Decidir con precisión bajo el apuro del reloj fortalece la priorización en entregas reales y prototipos iterativos.',
  },
];

export const TECH_STACK: TechStackItem[] = [
  { name: 'HTML5 & Canvas', role: 'Gráficos 2D e IK' },
  { name: 'CSS3 & Neumorfismo', role: 'Interfaces táctiles' },
  { name: 'JavaScript / TypeScript', role: 'Lógica tipada' },
  { name: 'React & Tailwind', role: 'Apps reactivas' },
  { name: 'Three.js / WebGL', role: 'Mundos y piezas 3D' },
  { name: 'Python', role: 'Automatización & IA' },
  { name: 'Vercel & Neocities', role: 'Despliegue ágil' },
  { name: 'Git & Codédex', role: 'Comunidad & código' },
];

export const PROJECT_CATEGORIES: ProjectCategory[] = [
  'Todos',
  'Salud & Fit',
  'Juegos 3D',
  'Comercio',
  'Lectura',
];

export const PROJECTS_DATA: ProjectItem[] = [
  {
    id: 'perday',
    title: 'PerDay — Calculadora del Ciclo Menstrual',
    category: 'Salud & Fit',
    year: '2026',
    description:
      'Aplicación web intuitiva para predecir y llevar el seguimiento del periodo menstrual de forma clara y rápida.',
    highlights: [
      'Cálculo instantáneo de días fértiles, ovulación y próximo ciclo.',
      'Interfaz limpia y privada pensada para consultas rápidas desde cualquier dispositivo.',
      'Visualización clara de fases sin fricción ni registros complejos.',
    ],
    tags: ['React', 'JavaScript', 'CSS Moderno', 'Vercel'],
    image: '/src/assets/images/project_perday_1794959122186.jpg',
    liveUrl: 'https://perday-sigma.vercel.app/',
    accent: 'emerald',
  },
  {
    id: 'wercelworld',
    title: 'WercelWorld — Juego Sandbox Estilo Minecraft',
    category: 'Juegos 3D',
    year: '2026',
    description:
      'Mundo abierto 3D en el navegador inspirado en Minecraft para explorar, construir y experimentar con bloques.',
    highlights: [
      'Generación de terreno por bloques en tiempo real con física y cámara fluida.',
      'Colocación y destrucción interactiva de bloques directamente en WebGL.',
      'Optimizado para correr sin descargas en navegadores de escritorio.',
    ],
    tags: ['Three.js', 'WebGL', 'JavaScript', '3D Sandbox'],
    image: '/src/assets/images/project_wercelworld_1794959122990.jpg',
    liveUrl: 'https://wercelworl.vercel.app/',
    accent: 'cyan',
  },
  {
    id: 'claudelink',
    title: 'ClaudeLink — Creador de Catálogos Digitales',
    category: 'Comercio',
    year: '2026',
    description:
      'Plataforma para crear y compartir catálogos interactivos de productos con prueba gratuita de un mes.',
    highlights: [
      'Creación ágil de escaparates digitales listos para compartir por enlace.',
      'Tarjetas de producto responsivas con diseño limpio orientado a conversión.',
      'Flujo pensado para emprendedores y marcas independientes.',
    ],
    tags: ['HTML5', 'CSS3', 'JavaScript', 'Catálogos Web'],
    image: '/src/assets/images/project_claudelink_1794959124444.jpg',
    liveUrl: 'https://nixai.neocities.org/LinkApp/CLAUDELINK',
    accent: 'gold',
  },
  {
    id: 'libro-zay',
    title: 'Libro Zay — Experiencia de Lectura Web',
    category: 'Lectura',
    year: '2025',
    description:
      'Publicación digital interactiva diseñada para una lectura inmersiva y fluida directamente desde el navegador.',
    highlights: [
      'Composición editorial enfocada en comodidad visual y ritmo narrativo.',
      'Navegación fluida entre capítulos sin recargas ni distracciones.',
      'Adaptación tipográfica limpia para escritorio y lectura móvil.',
    ],
    tags: ['HTML5', 'Tipografía Web', 'CSS3', 'Narrativa'],
    image: '/src/assets/images/project_librozay_1794959124282.jpg',
    liveUrl: 'https://nixai.neocities.org/LibroZay',
    accent: 'gold',
  },
  {
    id: 'fitzone',
    title: 'FitZone — Plataforma de Entrenamiento y Ejercicio',
    category: 'Salud & Fit',
    year: '2025',
    description:
      'Guía web dedicada al fitness, rutinas de ejercicio y seguimiento de actividad física.',
    highlights: [
      'Rutinas estructuradas por objetivos y grupos musculares.',
      'Seguimiento claro de sesiones para mantener la constancia diaria.',
      'Diseño energético y directo para consultar durante el entrenamiento.',
    ],
    tags: ['JavaScript', 'HTML5', 'UI Responsiva', 'Fitness'],
    image: '/src/assets/images/project_fitzone_1794959124813.jpg',
    liveUrl: 'https://nixai.neocities.org/FitZone',
    accent: 'emerald',
  },
  {
    id: 'libro-2',
    title: 'Libro 2 — Segunda Entrega Literaria',
    category: 'Lectura',
    year: '2025',
    description:
      'Continuación editorial en formato web con diseño limpio optimizado para lectores.',
    highlights: [
      'Estética editorial coherente pensada para sesiones largas de lectura.',
      'Estructura ligera y carga inmediata en cualquier navegador.',
      'Continuidad narrativa cuidada al detalle en formato digital.',
    ],
    tags: ['HTML5', 'Diseño Editorial', 'CSS3', 'Lectura Web'],
    image: '/src/assets/images/project_libro2_1794959124747.jpg',
    liveUrl: 'https://nixai.neocities.org/Libro%202',
    accent: 'cyan',
  },
];

export const SOCIAL_LINKS: SocialLinkItem[] = [
  {
    id: 'github',
    label: 'GitHub',
    handle: '@leiarojas-dev',
    url: 'https://github.com/',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    handle: 'in/leia-rojas',
    url: 'https://www.linkedin.com/',
  },
  {
    id: 'codedex',
    label: 'Codédex',
    handle: '@leiarojas',
    url: 'https://www.codedex.io/',
  },
  {
    id: 'lichess',
    label: 'Lichess / Chess',
    handle: 'LeiaTactica (1840)',
    url: 'https://lichess.org/',
  },
];
